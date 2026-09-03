import { motion } from 'framer-motion';
import { MovieImage } from './Poster';
import { useNavigate, useParams } from 'react-router-dom';
import { useVideoLibrary } from '../contexts/VideoLibraryContext';
import { isMobile } from '../utils/PlatformUtils';
import { DesktopMediaDetails } from '../../desktop/components/DesktopMediaDetails';
import { MobileMediaDetails } from '../../mobile/components/MobileMediaDetails';
import { ArrowLeftIcon } from 'lucide-react';

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
        <motion.div className={`absolute inset-0 z-50 flex flex-col items-center ${className}`}>
            {isMobile ? 
                <MobileMediaDetails media={media} tmdbId={tmdbId} navigate={navigate} /> : 
                <DesktopMediaDetails media={media} tmdbId={tmdbId} navigate={navigate} />
            }
        </motion.div>
    );
}
