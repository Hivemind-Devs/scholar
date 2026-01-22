const { scrapeProfile } = require('../../../scrapers/profile.scraper');
const logger = require('../../logger.service');
const { repositories } = require('../../../data-access');

/**
 * Starts the Profile Consumer.
 * @param {Object} rabbitClient - The RabbitMQ client instance.
 */
function startProfileConsumer(rabbitClient) {
    const queue = 'profile_tasks';
    const options = { prefetch: 15 };

    logger.info('🚀 Starting Profile Consumer...');

    rabbitClient.consumeFromQueue(queue, async (msgContent) => {
        try {
            const message = JSON.parse(msgContent);
            const url = message.url || message.profileUrl;

            if (!url) {
                logger.error('❌ Profile Consumer: Missing URL in message');
                return { success: true };
            }

            logger.info(`📥 Profile Worker received task for: ${url}`);
            
            // Extract yokId from URL
            const yokIdMatch = url.match(/authorId=([^&]+)/);
            const yokId = yokIdMatch ? yokIdMatch[1] : null;

            if (!yokId) {
                logger.error(`❌ Profile Consumer: Could not extract authorId from URL: ${url}`);
                return { success: true };
            }

            // Check if scholar exists
            let scholarId = await repositories.findScholarByYokId(yokId).toPromise();

            // Always scrape profile even if scholar exists, to update details
            const data = await scrapeProfile(url);
            logger.info(`✅ Profile Worker finished for: ${data.name}`);

            if (!scholarId) {
                // If not exists, create scholar first
                let uniName = null;
                let deptName = null;

                if (data.academicHistory && data.academicHistory.length > 0) {
                    const current = data.academicHistory[0]; 
                    uniName = current.university;
                    deptName = current.department;
                }

                scholarId = await repositories.createScholar({
                    yok_id: yokId,
                    full_name: data.name,
                    title: data.title,
                    department_id: null,
                    institution: uniName,
                    department: deptName,
                    email: data.email,
                    profile_url: url,
                    orcid: data.orcid,
                    research_areas: data.researchAreas
                }).toPromise();
                
                logger.info(`[Profile Consumer] Created new scholar: ${data.name}`);

            } else {
                // Scholar exists, update profile info (e.g. orcid, research areas, email might be better on profile page)
                await repositories.updateScholarProfile(scholarId, {
                    orcid: data.orcid,
                    research_areas: data.researchAreas,
                    email: data.email
                }).toPromise();
                
                logger.info(`[Profile Consumer] Updated existing scholar: ${data.name}`);
            }

            // Save/Update Image if exists
            if (data.image) {
                await repositories.insertScholarImage(scholarId, data.image).toPromise();
            }

            // Insert Details (Education, Academic, Publications, etc.)
            // Note: Since we don't have update/delete logic for sub-tables yet, 
            // simply inserting might duplicate if run multiple times.
            // For now, assuming standard flow (once per scholar) or we accept duplication risk until cleanup logic is added.
            
            if (data.educationHistory) {
                await repositories.insertEducationHistory(scholarId, data.educationHistory).toPromise();
            }

            if (data.academicHistory) {
                await repositories.insertAcademicHistory(scholarId, data.academicHistory).toPromise();
            }

            const pubsToInsert = [];
            if (data.details) {
                if (data.details.makaleler) data.details.makaleler.forEach(p => pubsToInsert.push({ ...p, category: 'makaleler' }));
                if (data.details.bildiriler) data.details.bildiriler.forEach(p => pubsToInsert.push({ ...p, category: 'bildiriler' }));
                if (data.details.kitaplar) data.details.kitaplar.forEach(p => pubsToInsert.push({ ...p, category: 'kitaplar' }));
                
                if (pubsToInsert.length > 0) {
                    await repositories.insertPublications(scholarId, pubsToInsert).toPromise();
                }

                if (data.details.dersler) {
                    await repositories.insertCourses(scholarId, data.details.dersler).toPromise();
                }

                if (data.details.yönetilen_tezler) {
                    await repositories.insertThesisSupervisions(scholarId, data.details.yönetilen_tezler).toPromise();
                }

                if (data.details.i̇dari_görevler || data.details.idari_görevler) {
                    const duties = data.details.i̇dari_görevler || data.details.idari_görevler;
                    await repositories.insertAdministrativeDuties(scholarId, duties).toPromise();
                }
            }

            logger.info(`[Profile Consumer] Saved/Updated full details for: ${data.name}`);
            
            return { success: true };

        } catch (error) {
            logger.error(`❌ Profile Consumer Error: ${error.message}`);
            return { success: false };
        }
    }, options);
}

module.exports = { startProfileConsumer };
