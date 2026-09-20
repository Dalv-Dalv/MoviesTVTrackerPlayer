import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { isMobile } from '../utils/PlatformUtils';
import { DesktopMediaDetails } from '../../desktop/components/DesktopMediaDetails';
import { MobileMediaDetails } from '../../mobile/components/MobileMediaDetails';

export function MediaDetails({ className = '' }) {
    const { tmdbId } = useParams();

    return (
        <motion.div className={`w-full min-h-full flex flex-col items-center relative z-50 ${className}`}>
            {isMobile ? 
                <MobileMediaDetails tmdbId={tmdbId} /> : 
                <DesktopMediaDetails tmdbId={tmdbId} />
            }
        </motion.div>
    );
}
