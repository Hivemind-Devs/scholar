const cheerio = require('cheerio');
const { CookieJar } = require('tough-cookie');
const proxyService = require('../services/proxy.service');
const { HttpsProxyAgent } = require('hpagent');

const BASE_URL = 'https://akademik.yok.gov.tr';

/**
 * Scrapes scholar data from the given department URL.
 * @param {string} departmentUrl - The URL of the department to scrape.
 * @returns {Promise<Array>} - An array of extracted scholar objects.
 */
async function scrapeScholar(departmentUrl) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.time('Scraping Time');
    
    // Get a proxy
    const proxy = proxyService.getProxy();
    
    try {
        const { got } = await import('got');

        const cookieJar = new CookieJar();
        
        const gotOptions = {
            cookieJar,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Connection': 'keep-alive'
            },
            https: {
                rejectUnauthorized: false
            },
            retry: {
                limit: 2
            }
        };

        if (proxy) {
            const proxyAuth = proxy.auth ? `${proxy.auth.username}:${proxy.auth.password}@` : '';
            const proxyUrl = `${proxy.protocol}://${proxyAuth}${proxy.host}:${proxy.port}`;
            
            gotOptions.agent = {
                https: new HttpsProxyAgent({
                    keepAlive: true,
                    keepAliveMsecs: 1000,
                    maxSockets: 256,
                    maxFreeSockets: 256,
                    scheduling: 'lifo',
                    proxy: proxyUrl
                })
            };
        }

        const client = got.extend(gotOptions);

        let currentUrl = departmentUrl;
        let pageCount = 0;
        let totalRows = 0;
        const allExtractedData = [];

        console.log(`Starting scrape for URL: ${departmentUrl}`);

        while (currentUrl) {
            pageCount++;
            console.log(`\n📄 Scraping Page ${pageCount}...`);
            console.log(`URL: ${currentUrl}`);

            const response = await client.get(currentUrl);
            const $ = cheerio.load(response.body);

            const table = $('#authorlistTb');
            if (table.length === 0) {
                console.log('⚠️  Table #authorlistTb not found on this page.');
                break;
            }

            // Extract rows
            let rows = table.find('tbody tr');
            if (rows.length === 0) {
                rows = table.find('tr').not('thead tr');
            }

            let pageRows = 0;
            rows.each((i, tr) => {
                const row = $(tr);
                const id = row.find('#spid').text().trim();
                const image = row.find('img.img-circle').attr('src');
                const title = row.find('td:eq(2) h6').first().text().trim();
                const name = row.find('h4 a').text().trim();
                const profileLink = row.find('h4 a').attr('href');
                // University info is in the second h6, but sometimes structure varies. 
                // It usually follows the name h4.
                const universityInfo = row.find('h4').next('h6').text().trim();
                
                const area = row.find('.label-success a').text().trim();
                const subArea = row.find('.label-primary a').text().trim();
                
                // Interests are in span following labels, separated by ;
                const interests = [];
                row.find('td:eq(2) > span:last-of-type a').each((_, el) => {
                    interests.push($(el).text().trim());
                });

                const email = row.find('a[href^="mailto:"]').text().trim();
                const authorId = row.find('#spid2').text().trim();

                if (name) {
                    const authorData = {
                        id,
                        image : image ? image.startsWith('data') ? image : null : null,
                        title,
                        name,
                        profileLink: profileLink ? BASE_URL + profileLink : null,
                        universityInfo,
                        area,
                        subArea,
                        interests,
                        email : email ? email.replace('[at]', '@') : null,
                        yokId : authorId ? authorId : null
                    };
                    allExtractedData.push(authorData);
                    pageRows++;
                }
            });
            
            totalRows += pageRows;
            console.log(`   -> Extracted ${pageRows} rows from this page.`);

            // Find next page
            const activeLi = $('ul.pagination li.active');
            const nextLi = activeLi.next('li');
            
            let nextPageFound = false;
            if (nextLi.length > 0) {
                const nextLink = nextLi.find('a');
                if (nextLink.length > 0) {
                    const href = nextLink.attr('href');
                    if (href && href !== '#') {
                        currentUrl = BASE_URL + href;
                        nextPageFound = true;
                        // Add a small delay to be polite
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }
            
            if (!nextPageFound) {
                currentUrl = null;
            }
        }

        console.log('\n✅ Scraping completed.');
        console.log(`Total Pages Scraped: ${pageCount}`);
        console.log(`Total Rows Extracted: ${totalRows}`);
        console.timeEnd('Scraping Time');
        
        return allExtractedData;

    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            console.error('\n❌ Error: Missing dependencies.');
            console.error('Please run the following command to install them:');
            console.error('npm install got cheerio tough-cookie hpagent\n');
        } else {
            console.error('❌ Error scraping:', error.message);
        }
        return [];
    } finally {
        // Always release the proxy when done or if an error occurs
        if (proxy) {
            proxyService.releaseProxy(proxy);
        }
    }
}

module.exports = {
    scrapeScholar
};
