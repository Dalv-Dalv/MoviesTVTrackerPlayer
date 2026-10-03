import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { isMobile } from '../utils/PlatformUtils';
import { DesktopMediaDetails } from '../../desktop/components/DesktopMediaDetails';
import { MobileMediaDetails } from '../../mobile/components/MobileMediaDetails';
import { DesktopPersonDetails } from '../../desktop/components/DesktopPersonDetails';
import { MobilePersonDetails } from '../../mobile/components/MobilePersonDetails';

export function DetailsPage({ className = '' }) {
    const { compId } = useParams();

    const [mediaType, rawId] = typeof compId === 'string' && compId.includes('_') 
        ? compId.split('_') 
        : [null, compId];

    return (
        <motion.div className={`w-full min-h-full flex flex-col items-center relative z-50 ${className}`}>
            {mediaType === 'person' ? (
                isMobile ? <MobilePersonDetails rawTmdbId={rawId} /> : <DesktopPersonDetails rawTmdbId={rawId} />
            ) : isMobile ? (
                <MobileMediaDetails compId={compId} />
            ) : (
                <DesktopMediaDetails compId={compId} />
            )}
        </motion.div>
    );
}
