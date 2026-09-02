import { motion } from 'framer-motion';
import { MovieImage } from './Poster';
import { useNavigate, useParams } from 'react-router-dom';
import { useVideoLibrary } from '../contexts/VideoLibraryContext';
import { isMobile } from '../utils/PlatformUtils';
import { DesktopMediaDetails } from '../../desktop/components/DesktopMediaDetails';
import { MobileMediaDetails } from '../../mobile/components/MobileMediaDetails';

export function MediaDetails({ className = '' }) {
    const { tmdbId } = useParams();
    const navigate = useNavigate();
    const { library } = useVideoLibrary();

    const media = library[tmdbId];

    if (!media) return (
        <div className="flex items-center justify-center h-full text-white">
            <h2>Movie not found!</h2>
            <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
    );

    return (
        <motion.div className={`absolute inset-0 z-50 flex flex-col items-center md:p-12 md:pt-22 md:gap-12 p-4 pt-16 gap-6 ${className}`}>

            <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => navigate(-1)}
                className="absolute top-8 md:top-20 right-6 md:right-8 text-white z-50 cursor-pointer"
            >
                Close
            </motion.button>

            {isMobile ? 
                <MobileMediaDetails media={media} tmdbId={tmdbId} navigate={navigate} /> : 
                <DesktopMediaDetails media={media} tmdbId={tmdbId} navigate={navigate} />
            }
        </motion.div>
    );
}
