import { motion } from 'framer-motion';
import { MovieImage } from './MovieImage';
import { useNavigate, useParams } from 'react-router-dom';
import { useLibraryStore } from '../store/useLibraryStore';
import { isMobile } from '../utils/PlatformUtils';
import { DesktopMediaDetails } from '../../desktop/components/DesktopMediaDetails';
import { MobileMediaDetails } from '../../mobile/components/MobileMediaDetails';
import { ArrowLeftIcon } from 'lucide-react';

export function MediaDetails({ className = '' }) {
    const { tmdbId } = useParams();
    const navigate = useNavigate();
    const library = useLibraryStore(state => state.library);

    const media = library[tmdbId];

    if (!media) return (
        <div className="flex items-center justify-center h-full text-white">
            <h2>Movie not found!</h2>
            <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
    );

    return (
        <motion.div className={`w-full min-h-full flex flex-col items-center relative z-50 ${className}`}>
            {isMobile ? 
                <MobileMediaDetails media={media} tmdbId={tmdbId} navigate={navigate} /> : 
                <DesktopMediaDetails media={media} tmdbId={tmdbId} navigate={navigate} />
            }
        </motion.div>
    );
}
