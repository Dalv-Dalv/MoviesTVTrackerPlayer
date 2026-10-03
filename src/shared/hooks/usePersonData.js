import { useEffect, useState } from "react";
import { useTMDB } from "./useTMDB";
import { getImageUrl, IMAGE_SIZES } from "../services/TMDBMetadata";

export function usePersonData(rawTmdbId) {
    const tmdb = useTMDB();
    const [person, setPerson] = useState(null);
    const [knownForCredits, setKnownForCredits] = useState([]);
    const [credits, setCredits] = useState([]);
    const [roles, setRoles] = useState([]);
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!tmdb || !rawTmdbId) return;
        setIsLoading(true);

        const fetchData = async () => {
            try {
                const personData = await tmdb.people.details(rawTmdbId);
                const creditsData = await tmdb.people.combinedCredits(rawTmdbId);
                const imagesData = await tmdb.people.images(rawTmdbId);

                setPerson({
                    ...personData,
                    profilePath: getImageUrl(personData.profile_path, IMAGE_SIZES.person),
                    profilePathFull: getImageUrl(personData.profile_path, IMAGE_SIZES.full)
                });

                const formattedImages = (imagesData.profiles || []).map(img => ({
                    url: getImageUrl(img.file_path, IMAGE_SIZES.person),
                    urlFull: getImageUrl(img.file_path, IMAGE_SIZES.full)
                }));
                setImages(formattedImages);

                const allCreditsMap = new Map();
                const knownDept = personData.known_for_department;

                const mapCreditItem = (item) => ({
                    ...item,
                    posterPath: getImageUrl(item.poster_path, IMAGE_SIZES.poster),
                    posterPathFull: getImageUrl(item.poster_path, IMAGE_SIZES.full),
                    backdropPath: getImageUrl(item.backdrop_path, IMAGE_SIZES.backdrop),
                    backdropPathFull: getImageUrl(item.backdrop_path, IMAGE_SIZES.full)
                });

                if (creditsData.cast) {
                    creditsData.cast.forEach(item => {
                        if (item.poster_path) allCreditsMap.set(item.id, { ...mapCreditItem(item), isCast: true });
                    });
                }

                if (creditsData.crew) {
                    creditsData.crew.forEach(item => {
                        if (item.poster_path) {
                            const existing = allCreditsMap.get(item.id);
                            if (existing) {
                                existing.isCrew = true;
                                existing.jobs = existing.jobs || [];
                                if (item.job && !existing.jobs.includes(item.job)) existing.jobs.push(item.job);
                                if (item.department === knownDept || !existing.department) existing.department = item.department;
                            } else {
                                allCreditsMap.set(item.id, { ...mapCreditItem(item), isCrew: true, jobs: item.job ? [item.job] : [], department: item.department });
                            }
                        }
                    });
                }

                const sortedCredits = Array.from(allCreditsMap.values())
                    .sort((a, b) => {
                        const getScore = (item) => {
                            let score = (item.vote_count || 0) + (item.popularity || 0);

                            if (knownDept === 'Acting' && item.isCast) score *= 1.5;
                            if (knownDept !== 'Acting' && item.isCrew && item.department === knownDept) score *= 2.0;

                            if (item.jobs && (item.jobs.includes('Director') || item.jobs.includes('Writer') || item.jobs.includes('Creator'))) {
                                score *= 2.0;
                            }

                            if (item.isCast && item.order !== undefined) {
                                if (item.order < 3) score *= 2.5;
                                else if (item.order < 10) score *= 1.5;
                                else if (item.order > 20) score *= 0.2;
                            }

                            if (item.genre_ids && (item.genre_ids.includes(10767) || item.genre_ids.includes(10764) || item.genre_ids.includes(10763))) {
                                score *= 0.1;
                            }

                            if (item.isCast) {
                                const charStr = item.character || '';
                                if (/\b(self|himself|herself|guest)\b/i.test(charStr)) {
                                    score *= 0.1;
                                }
                            }

                            const releaseDate = item.release_date || item.first_air_date;
                            if (releaseDate) {
                                const year = parseInt(releaseDate.split('-')[0]);
                                const currentYear = new Date().getFullYear();
                                const yearsOld = currentYear - year;

                                if (!isNaN(yearsOld)) {
                                    const timeBoost = Math.max(0.8, 1.5 - (Math.max(0, yearsOld) * 0.04));
                                    score *= timeBoost;
                                }
                            }

                            return score;
                        };
                        return getScore(b) - getScore(a);
                    })
                    .slice(0, 20);
                
                const allCredits = Array.from(allCreditsMap.values())
                    .map(item => {
                        const dateString = item.release_date || item.first_air_date || '';
                        const date = dateString ? new Date(dateString) : new Date('9999-12-31');
                        return { ...item, date, year: dateString ? date.getFullYear() : null };
                    })
                    .sort((a, b) => b.date - a.date);

                const roleCountsMap = new Map();
                allCreditsMap.forEach(item => {
                    const isSelf = /\b(self|himself|herself)\b/i.test(item.character || '');
                    const jobs = item.isCast 
                        ? [(isSelf ? "Self" : (personData.gender === 1 ? "Actress" : "Actor")), ...(item.jobs || [])] 
                        : (item.jobs || []);
                    
                    const uniqueJobs = Array.from(new Set(jobs));
                    uniqueJobs.forEach(job => {
                        if (job) {
                            roleCountsMap.set(job, (roleCountsMap.get(job) || 0) + 1);
                        }
                    });
                });

                const aggregatedRoles = Array.from(roleCountsMap.entries())
                    .map(([role, count]) => ({ role, count }))
                    .sort((a, b) => b.count - a.count);

                setKnownForCredits(sortedCredits);
                setCredits(allCredits);
                setRoles(aggregatedRoles);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to fetch person details", err);
                setIsLoading(false);
            }
        };

        fetchData();
    }, [tmdb, rawTmdbId]);

    const formattedBirthday = person?.birthday ? new Date(person.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : '-';
    let age = null;
    if (person?.birthday) {
        const bDate = new Date(person.birthday);
        const end = person.deathday ? new Date(person.deathday) : new Date();
        age = end.getUTCFullYear() - bDate.getUTCFullYear();
        const m = end.getUTCMonth() - bDate.getUTCMonth();
        if (m < 0 || (m === 0 && end.getUTCDate() < bDate.getUTCDate())) {
            age--;
        }
    }

    return { person, knownForCredits, credits, images, roles, isLoading, formattedBirthday, age };
}
