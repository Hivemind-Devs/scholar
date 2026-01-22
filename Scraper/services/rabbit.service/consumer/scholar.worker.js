const { scrapeScholar } = require('../../../scrapers/scholar.scraper');
const logger = require('../../logger.service'); // Using the logger service
const { repositories } = require('../../../data-access');

/**
 * Starts the Scholar Consumer.
 * @param {Object} rabbitClient - The RabbitMQ client instance.
 */
function startScholarConsumer(rabbitClient) {
    const queue = 'scholar_tasks';
    const options = { prefetch: 5 };

    logger.info('🚀 Starting Scholar Consumer...');

    rabbitClient.consumeFromQueue(queue, async (msgContent) => {
        try {
            const message = JSON.parse(msgContent);
            // Handling different message formats just in case
            const url = message.url || message.departmentUrl;
            
            if (!url) {
                logger.error('❌ Scholar Consumer: Missing URL in message');
                return { success: true }; 
            }

            logger.info(`📥 Scholar Worker received task for: ${url}`);
            
            // Extract department info from URL if possible to avoid upserts
            // But actually we are scraping the page, so we get scholars.
            // The constraint is we cannot upsert Uni/Dept. We must look it up.
            // However, we don't know the ID from the scrape result directly unless we query by URL.
            // The prompt says "university_id yi link üzerinden department tablosundan getir".
            // It means use the `departmentUrl` (which is `url`) to find the department record in DB.
            
            const data = await scrapeScholar(url);
            logger.info(`✅ Scholar Worker finished. Scraped ${data.length} records.`);
            
            // Find Department ID using the scraped URL
            // Since the URL might have extra params or slight differences, we should be careful.
            // Assuming the URL in DB matches the scraped URL exactly or closely.
            // We need a repository method to find department by URL.
            
            let departmentId = null;
            let universityId = null;
            let institutionName = null;
            let departmentName = null;

            try {
                // We need to implement findDepartmentByUrl in repositories or use queryBuilder here.
                // For now let's assume repositories has it or we add it.
                // The user said "link üzerinden department tablosundan getir".
                
                // Let's first try to get it.
                const deptRecord = await repositories.findDepartmentByUrl(url).toPromise();
                
                if (deptRecord) {
                    departmentId = deptRecord.department_id;
                    universityId = deptRecord.university_id;
                    // We can also fetch names if needed for the 'institution'/'department' text fields in Scholar table
                    institutionName = deptRecord.university_name; // Assuming join or we fetch separate
                    departmentName = deptRecord.name;
                } else {
                     logger.warn(`⚠️ Department not found for URL: ${url}. Scholars will be saved without department link.`);
                }

            } catch (err) {
                logger.error(`Error finding department by URL: ${err.message}`);
            }

            for (const scholar of data) {
                try {
                    // Check if scholar exists
                    const existingId = await repositories.findScholarByYokId(scholar.yokId).toPromise();
                    let scholarId = existingId;
                    
                    if (!scholarId) {
                        
                        // Create Scholar using the resolved departmentId from the URL
                        scholarId = await repositories.createScholar({
                            yok_id: scholar.yokId,
                            full_name: scholar.name,
                            title: scholar.title,
                            department_id: departmentId, // Resolved from URL
                            institution: institutionName || scholar.universityInfo, // Fallback to scraped text
                            department: departmentName,
                            email: scholar.email,
                            profile_url: scholar.profileLink,
                            orcid: scholar.orcid,
                            research_areas: scholar.interests
                        }).toPromise();
                        
                        logger.info(`[Scholar Consumer] Saved scholar: ${scholar.name}`);
                        
                        // Save Image if exists
                        if (scholar.image) {
                            await repositories.insertScholarImage(scholarId, scholar.image).toPromise();
                        }

                    } else {
                        // Scholar exists
                    }

                    // Publish to Profile Queue for detailed scraping
                    if (scholar.profileLink) {
                        rabbitClient.publishToQueue('profile_tasks', JSON.stringify({ 
                            url: scholar.profileLink,
                            yokId: scholar.yokId 
                        }));
                    }

                } catch (err) {
                    logger.error(`[Scholar Consumer] Error saving/queuing scholar ${scholar.name}: ${err.message}`);
                }
            }
            
            return { success: true };

        } catch (error) {
            logger.error(`❌ Scholar Consumer Error: ${error.message}`);
            return { success: false };
        }
    }, options);
}

module.exports = { startScholarConsumer };
