const fs = require('fs');
const cheerio = require('cheerio');
const { CookieJar } = require('tough-cookie');
const proxyService = require('../services/proxy.service');
const { HttpsProxyAgent } = require('hpagent');

/**
 * Creates a configured got client
 */
async function createClient(jar, proxy) {
    const { got } = await import('got');
    
    const gotOptions = {
        cookieJar: jar,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Connection': 'keep-alive'
        },
        https: { rejectUnauthorized: false },
        retry: { limit: 2 }
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

    return got.extend(gotOptions);
}

/**
 * Scrapes content from sub-pages (Publications, Duties, etc.)
 */
async function scrapeSubPage(client, url, categoryName) {
    console.log(`   -> Scraping ${categoryName}: ${url}`);
    
    // Add delay to be polite
    await new Promise(resolve => setTimeout(resolve, 800));

    // Normalize category name to match mapping keys
    // Example: "Yönetilen Tezler" -> "yonetilen_tezler"
    // Using a simpler normalization that handles turkish chars loosely if needed, 
    // but here we just replicate the main logic: lowercase and underscore.
    const normalizedCategory = categoryName.toLowerCase().replace(/\s+/g, '_');

    // Column mappings based on analyzed JSON structure
    const columnMappings = {
        'dersler': ['year', 'name', 'language', 'hours'],
        'yönetilen_tezler': ['year', 'student', 'title', 'institution'],
        'makaleler': ['sequence', 'citation'],
        'bildiriler': ['sequence', 'citation'],
        'kitaplar': ['sequence', 'citation'],
        'projeler': ['sequence', 'citation'],
        'patentler': ['sequence', 'citation'],
        'ödüller': ['sequence', 'citation'],
        'üyelikler': ['sequence', 'citation'],
        'sanatsal_faaliyetler': ['sequence', 'citation']
    };

    try {
        const response = await client.get(url);
        const $ = cheerio.load(response.body);
        const data = [];

        // Generic table parser
        // Most sub-pages have tables with data
        $('table tbody tr').each((i, tr) => {
            const rowData = {};
            
            // Special handling for Citation pages (Makaleler, Bildiriler, etc.)
            const citationTypes = ['makaleler', 'bildiriler', 'kitaplar', 'projeler', 'patentler', 'ödüller', 'üyelikler', 'sanatsal_faaliyetler'];
            
            if (citationTypes.includes(normalizedCategory)) {
                // For citation types, we usually have a sequence number in first cell
                // and a big chunk of text in the second cell.
                const sequence = $(tr).find('td').eq(0).text().trim();
                const citationText = $(tr).find('td').eq(1).text().trim();
                
                if (!citationText) return;

                // Parse citation text
                // Example format:
                // "Title\n\n\t\t...\t\tAuthors\n, Yayın Yeri:Journal\n, Year\n\n\nScope\n\n \nPeerReview\n\n \nIndex\n\n \nType\n\n  DOI_URL"
                
                // Extract DOI or URL if exists
                let doi = null;
                const urlMatch = citationText.match(/(https?:\/\/[^\s]+)/);
                if (urlMatch) {
                    doi = urlMatch[0];
                }

                // Split by comma to find Publication Place and Year
                // This is heuristics-based as the format is unstructured text
                const parts = citationText.split(',').map(p => p.trim());
                
                // Title is usually the first part before any comma, but authors might be separated by commas too.
                // A better approach is splitting by newlines first.
                const lines = citationText.split('\n').map(l => l.trim()).filter(l => l);
                
                // Line 0: Title
                const title = lines[0];
                
                // Authors usually come after title, often in the same block or next line
                // "Title ... \n\n Authors"
                // Let's try to extract authors. Authors are often UPPERCASE or Capitalized, separated by commas.
                // They appear before "Yayın Yeri:"
                
                let authors = '';
                let publicationPlace = '';
                let year = '';
                let type = ''; // Özgün Makale etc.
                
                // Simple regex extraction for known patterns
                const publicationMatch = citationText.match(/Yayın Yeri:(.*?)(,|$|\n)/);
                if (publicationMatch) {
                    publicationPlace = publicationMatch[1].trim();
                }

                // Year is usually a 4 digit number at the end of a line or after publication place
                // We look for a 4-digit number that is likely a year (19xx or 20xx)
                const yearMatch = citationText.match(/,\s*(19|20)\d{2}/);
                if (yearMatch) {
                    // Extract just the year from the match ", 2025" -> "2025"
                    year = yearMatch[0].replace(',', '').trim();
                }

                // Extract Authors: Everything between Title and "Yayın Yeri" or the first date/year
                // This is tricky. Let's assume authors are in the text block before "Yayın Yeri"
                let authorsArray = [];
                if (publicationMatch) {
                    const textBeforePub = citationText.substring(0, publicationMatch.index);
                    // Remove title from it
                    let potentialAuthors = textBeforePub.replace(title, '').trim();
                    
                    // Clean up newlines and excessive spaces
                    potentialAuthors = potentialAuthors.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
                    
                    // Split authors by comma and clean up
                    // Remove trailing comma if any
                    potentialAuthors = potentialAuthors.replace(/,$/, '').trim();
                    
                    if (potentialAuthors) {
                        authorsArray = potentialAuthors.split(',').map(a => a.trim()).filter(a => a);
                    }
                }

                // Extract Type (e.g. Özgün Makale, Tam metin bildiri)
                // Often appears at the end lines
                const types = ['Özgün Makale', 'Tam metin bildiri', 'Derleme', 'Kitap', 'Editörlük', 'Poster'];
                for (const t of types) {
                    if (citationText.includes(t)) {
                        type = t;
                        break;
                    }
                }

                // Extract Index (SCI, SCI-Expanded, etc.)
                const indexes = ['SCI-Expanded', 'SCI', 'SSCI', 'AHCI', 'Scopus', 'TR Dizin', 'Diğer endeksler'];
                let index = '';
                for (const idx of indexes) {
                    if (citationText.includes(idx)) {
                        index = idx;
                        break;
                    }
                }

                rowData['sequence'] = sequence;
                rowData['title'] = title;
                rowData['authors'] = authorsArray;
                rowData['publicationPlace'] = publicationPlace;
                rowData['year'] = year;
                rowData['doi'] = doi;
                rowData['type'] = type;
                rowData['index'] = index;
                // Keep raw citation just in case
                // rowData['raw_citation'] = citationText;

                data.push(rowData);

            } else {
                // Normal table processing for non-citation categories (Dersler, Tezler)
                $(tr).find('td').each((j, td) => {
                    const text = $(td).text().trim();
                    let key = `col_${j}`;
                    if (columnMappings[normalizedCategory] && columnMappings[normalizedCategory][j]) {
                        key = columnMappings[normalizedCategory][j];
                    }
                    rowData[key] = text;
                });
                if (Object.keys(rowData).length > 0) {
                    data.push(rowData);
                }
            }
        });

        // Timeline parser (for some pages like Administrative Duties which might use timeline)
        if (data.length === 0 && $('.timeline').length > 0) {
             $('.timeline li').each((i, el) => {
                const item = $(el);
                if (item.hasClass('time-label')) {
                    const year = item.find('span').text().trim();
                    let nextContent = item.next();
                    while (nextContent.length > 0 && !nextContent.hasClass('time-label') && nextContent.find('.timeline-item').length > 0) {
                        const title = nextContent.find('.timeline-footer .btn').text().trim();
                        const content = nextContent.find('.timeline-item').text().trim().replace(/\s+/g, ' ');
                        
                        data.push({ 
                            year, 
                            title,
                            content 
                        });
                        nextContent = nextContent.next();
                    }
                }
            });
        }

        return data;
    } catch (error) {
        console.error(`   ❌ Error scraping ${categoryName}: ${error.message}`);
        return null;
    }
}

/**
 * Scrapes profile data and all linked sub-pages.
 * @param {string} profileUrl - The URL of the profile to scrape.
 * @returns {Promise<Object>} - The scraped profile data.
 */
async function scrapeProfile(profileUrl) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.time('Profile Scraping Time');
    
    const proxy = proxyService.getProxy();
    
    try {
        const cookieJar = new CookieJar();
        const client = await createClient(cookieJar, proxy);

        console.log(`Starting profile scrape for URL: ${profileUrl}`);
        const response = await client.get(profileUrl);
        const $ = cheerio.load(response.body);

        // --- Parsing Main Profile ---

        // 1. Basic Info
        const authorTable = $('#authorlistTb');
        const name = authorTable.find('h4').text().trim();
        const title = authorTable.find('h6').first().text().trim();
        let email = authorTable.find('a[href^="mailto:"]').text().trim().replace('[at]', '@');
        const orcidText = $('.greenOrcid p').text().trim();
        const orcid = orcidText.replace('ORCID:', '').trim();
        const image = $('img.img-circle').attr('src');

        const researchAreas = [];
        authorTable.find('.label-success, .label-primary').each((i, el) => {
            researchAreas.push($(el).text().trim());
        });

        // 2. Academic History (Timeline)
        const academicHistory = [];
        const academicCol = $('.timeline').first(); 
        academicCol.find('li').each((i, el) => {
            const item = $(el);
            if (item.hasClass('time-label')) {
                const year = item.find('span').text().trim();
                let nextContent = item.next();
                while (nextContent.length > 0 && !nextContent.hasClass('time-label') && nextContent.find('.timeline-item').length > 0) {
                    const jobTitle = nextContent.find('.timeline-footer .btn').text().trim();
                    const university = nextContent.find('.timeline-item h4').text().trim();
                    const department = nextContent.find('.timeline-item h5').text().trim();
                    academicHistory.push({ year, jobTitle, university, department });
                    nextContent = nextContent.next();
                }
            }
        });

        // 3. Education History (Timeline)
        const educationHistory = [];
        const educationHeader = $('.timeline .time-label span.bg-default').filter(function() {
            return $(this).text().trim() === 'Öğrenim Bilgisi';
        });

        if (educationHeader.length > 0) {
            const educationTimeline = educationHeader.closest('.timeline');
            educationTimeline.find('li').each((i, el) => {
                const item = $(el);
                if (item.hasClass('time-label') && !item.find('span').hasClass('bg-default')) {
                    const year = item.find('span').text().trim();
                    let nextContent = item.next();
                    while (nextContent.length > 0 && !nextContent.hasClass('time-label') && nextContent.find('.timeline-item').length > 0) {
                        const degree = nextContent.find('.timeline-footer .btn').text().trim();
                        const university = nextContent.find('.timeline-item h4').text().trim();
                        const department = nextContent.find('.timeline-item h5').text().trim();
                        const thesis = nextContent.find('.timeline-item h6').text().trim();
                        educationHistory.push({
                            year, degree, university, department,
                            thesis: thesis.replace('Tez adı:', '').trim()
                        });
                        nextContent = nextContent.next();
                    }
                }
            });
        }

        // 4. Extract Links & Scrape Sub-pages
        const subPageData = {};
        
        // We need to use a normal loop to await async operations
        const linkElements = $('.sidebar-nav ul.nav li a').toArray();
        
        for (const el of linkElements) {
            const link = $(el);
            const href = link.attr('href');
            const text = link.text().trim();
            
            // Ignore "Kişisel Bilgiler" and "#"
            if (href && href !== '#' && !href.includes('viewAuthor.jsp')) {
                const fullUrl = href.startsWith('http') ? href : `https://akademik.yok.gov.tr${href}`;
                const key = text.toLowerCase().replace(/\s+/g, '_');
                
                // Recursively scrape this sub-page
                const data = await scrapeSubPage(client, fullUrl, text);
                if (data) {
                    subPageData[key] = data;
                }
            }
        }

        const profileData = {
            name,
            title,
            email,
            orcid,
            image: image && image.startsWith('data') ? image : null,
            researchAreas,
            academicHistory,
            educationHistory,
            details: subPageData // Contains all scraped sub-pages
        };

        console.timeEnd('Profile Scraping Time');
        return profileData;

    } catch (error) {
        console.error('❌ Error scraping profile:', error.message);
        throw error;
    } finally {
        if (proxy) {
            proxyService.releaseProxy(proxy);
        }
    }
}

module.exports = {
    scrapeProfile
};
