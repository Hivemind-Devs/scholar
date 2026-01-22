const { of, from, forkJoin, iif, throwError, EMPTY } = require('rxjs');
const { mergeMap, map, catchError, defaultIfEmpty, tap, toArray } = require('rxjs/operators');
const { v4: uuid } = require('uuid');

const makeRepositories = (queryBuilder) => {

    const findDepartmentByUrl = (url) => {
        return queryBuilder({
            query: `
                SELECT d.department_id, d.university_id, d.name, u.name as university_name 
                FROM department d
                LEFT JOIN university u ON d.university_id = u.university_id
                WHERE d.url = $1
            `,
            params: [url]
        }).pipe(
            map(result => result.data.rows.length > 0 ? result.data.rows[0] : null)
        );
    };

    const findScholarByYokId = (yokId) => {
        return queryBuilder({
            query: `SELECT scholar_id FROM scholar WHERE yok_id = $1`,
            params: [yokId]
        }).pipe(
            map(result => result.data.rows.length > 0 ? result.data.rows[0].scholar_id : null)
        );
    };

    const createScholar = (scholarData) => {
        const {
            yok_id, full_name, title, department_id, institution, department,
            email, profile_url, orcid, research_areas
        } = scholarData;

        return queryBuilder({
            query: `
                INSERT INTO scholar (
                    scholar_id, yok_id, full_name, title, department_id, institution, department,
                    email, profile_url, orcid, research_areas
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING scholar_id
            `,
            params: [
                uuid(), yok_id, full_name, title, department_id, institution, department,
                email, profile_url, orcid, research_areas
            ]
        }).pipe(
            map(result => result.data.rows[0].scholar_id)
        );
    };

    const updateScholarProfile = (scholarId, updateData) => {
        const { orcid, research_areas, email } = updateData;
        return queryBuilder({
            query: `
                UPDATE scholar 
                SET orcid = COALESCE($2, orcid),
                    research_areas = COALESCE($3, research_areas),
                    email = COALESCE($4, email),
                    last_updated = NOW()
                WHERE scholar_id = $1
            `,
            params: [scholarId, orcid, research_areas, email]
        });
    };

    const insertScholarImage = (scholarId, base64Data) => {
        if (!base64Data) return of(null);
        // Removed ON CONFLICT (scholar_id) because the unique constraint might be missing on DB level.
        // We will check first or just INSERT since we are in a flow where we usually know state.
        // Or better: try UPDATE first, if 0 rows, then INSERT.
        
        return queryBuilder({
            query: `UPDATE scholar_image SET image_data = $2 WHERE scholar_id = $1`,
            params: [scholarId, base64Data]
        }).pipe(
            mergeMap(result => {
                if (result.data.rowCount === 0) {
                     return queryBuilder({
                        query: `INSERT INTO scholar_image (image_id, scholar_id, image_data) VALUES ($1, $2, $3)`,
                        params: [uuid(), scholarId, base64Data]
                    });
                }
                return of(result);
            })
        );
    };

    const insertEducationHistory = (scholarId, history) => {
        if (!history || history.length === 0) return of(null);
        
        return from(history).pipe(
            mergeMap(item => {
                return queryBuilder({
                    query: `INSERT INTO education_history (edu_id, scholar_id, year_range, degree, university, department_info, thesis_title) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    params: [uuid(), scholarId, item.year, item.degree, item.university, item.department, item.thesis]
                });
            }, 5),
            toArray()
        );
    };

    const insertAcademicHistory = (scholarId, history) => {
        if (!history || history.length === 0) return of(null);

        return from(history).pipe(
            mergeMap(item => {
                return queryBuilder({
                    query: `INSERT INTO academic_history (acad_id, scholar_id, year, position, university, department_info) VALUES ($1, $2, $3, $4, $5, $6)`,
                    params: [uuid(), scholarId, item.year, item.jobTitle, item.university, item.department]
                });
            }, 5),
            toArray()
        );
    };

    const insertPublications = (scholarId, publications) => {
        if (!publications || publications.length === 0) return of(null);
        
        return from(publications).pipe(
            mergeMap(pub => {
                // Removed ON CONFLICT (doi) DO NOTHING to avoid "no unique constraint matching" error if DOI is not unique in DB
                // Instead, we will just INSERT. Duplicate DOIs might happen if different scholars have same paper.
                // If the DB strictly enforces unique DOI, this will fail on duplicate.
                // If we want to avoid failure, we can wrap in try/catch (via catchError in RxJS) but queryBuilder handles error logging.
                // Let's assume we want to insert and ignore error if unique violation occurs.
                
                return queryBuilder({
                    query: `
                        INSERT INTO publication (pub_id, scholar_id, title, year, doi, venue, type, publication_index, category, authors_json)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    `,
                    params: [
                        uuid(), scholarId, pub.title, pub.year, pub.doi || null, pub.publicationPlace,
                        pub.type, pub.index, pub.category, JSON.stringify(pub.authors)
                    ]
                }).pipe(
                    catchError(err => {
                        // Ignore unique constraint violations (code 23505)
                        if (err.code === '23505') return of(null);
                        throw err; 
                    })
                );
            }, 5),
            toArray()
        );
    };

    const insertCourses = (scholarId, courses) => {
        if (!courses || courses.length === 0) return of(null);
        
        return from(courses).pipe(
            mergeMap(course => {
                return queryBuilder({
                    query: `INSERT INTO course (course_id, scholar_id, academic_year, name, language, hours) VALUES ($1, $2, $3, $4, $5, $6)`,
                    params: [uuid(), scholarId, course.year, course.name, course.language, course.hours]
                });
            }, 5),
            toArray()
        );
    };

    const insertThesisSupervisions = (scholarId, theses) => {
        if (!theses || theses.length === 0) return of(null);

        return from(theses).pipe(
            mergeMap(thesis => {
                return queryBuilder({
                    query: `INSERT INTO thesis_supervision (thesis_id, scholar_id, year, student_name, title, institution) VALUES ($1, $2, $3, $4, $5, $6)`,
                    params: [uuid(), scholarId, thesis.year, thesis.student, thesis.title, thesis.institution]
                });
            }, 5),
            toArray()
        );
    };

    const insertAdministrativeDuties = (scholarId, duties) => {
        if (!duties || duties.length === 0) return of(null);

        return from(duties).pipe(
            mergeMap(duty => {
                return queryBuilder({
                    query: `INSERT INTO administrative_duty (duty_id, scholar_id, year_range, title, content) VALUES ($1, $2, $3, $4, $5)`,
                    params: [uuid(), scholarId, duty.year, duty.title, duty.institution || duty.content]
                });
            }, 5),
            toArray()
        );
    };

    // Disabled upserts
    const upsertUniversity = (name) => of(null);
    const upsertDepartment = (uid, name) => of(null);

    return {
        findDepartmentByUrl,
        upsertUniversity,
        upsertDepartment,
        findScholarByYokId,
        createScholar,
        updateScholarProfile,
        insertScholarImage,
        insertEducationHistory,
        insertAcademicHistory,
        insertPublications,
        insertCourses,
        insertThesisSupervisions,
        insertAdministrativeDuties
    };
};

module.exports = makeRepositories;
