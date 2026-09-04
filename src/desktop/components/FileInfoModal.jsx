import { useState, useEffect } from 'react';
import { Modal } from '../../shared/components/Modal';
import { CaretDownIcon, InfoIcon } from '@phosphor-icons/react';
import { extractVideoMetadata } from '../../shared/services/MetadataExtractor';
import { AnimatePresence, motion } from 'framer-motion';

const getShortPath = (fullPath) => {
    const parts = fullPath.split(/[\\/]/).filter(Boolean);
    if (parts.length >= 2) {
        return parts.slice(-2).join('/');
    }
    return fullPath;
};

const FileInfoCard = ({ path, info, loading, media }) => {
    const [audioExpanded, setAudioExpanded] = useState(false);
    const [subsExpanded, setSubsExpanded] = useState(false);

    const videoTrack = info?.find(t => t['@type'] === 'Video');
    const audioTracks = info?.filter(t => t['@type'] === 'Audio') || [];
    const textTracks = info?.filter(t => t['@type'] === 'Text') || [];
    
    console.log(audioTracks);
    console.log(textTracks);

    // Parse info
    const width = videoTrack?.Width;
    const height = videoTrack?.Height;
    const resolution = (width && height) ? `${width}x${height}` : 'Unknown';
    const codec = videoTrack?.Format || 'Unknown';
    
    const isHDR = videoTrack?.HDR_Format || videoTrack?.transfer_characteristics?.includes('PQ') || videoTrack?.transfer_characteristics?.includes('HLG');

    return (
        <div className="bg-black/20 border border-divider rounded-lg p-4 flex flex-col gap-3">
            <div>
                <p className="font-semibold text-body break-all">{path.split(/[\\/]/).pop()}</p>
                <p className="text-muted text-sm break-all">{path}</p>
            </div>

            {loading ? (
                <div className="animate-pulse flex flex-col gap-2 mt-2">
                    <div className="h-4 bg-white/5 rounded w-3/4"></div>
                    <div className="h-4 bg-white/5 rounded w-1/2"></div>
                </div>
            ) : info?.error ? (
                <div className="text-sm mt-2 text-danger-500">Failed to load metadata.</div>
            ) : info ? (
                <div className="flex flex-col gap-4 mt-2">
                    {/* Basic Video Specs */}
                    <div className="flex flex-wrap gap-2 text-sm">
                        <span className="bg-white/10 text-body px-2 py-1 rounded border border-white/5">{resolution}</span>
                        <span className="bg-white/10 text-body px-2 py-1 rounded border border-white/5">{codec}</span>
                        {isHDR && <span className="bg-linear-to-r from-primary/20 to-primary-hover/50 bg-no-repeat text-primary border border-primary/50 px-2 py-1 rounded font-semibold">HDR</span>}
                    </div>

                    {/* Audio Tracks Section */}
                    {audioTracks.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={() => setAudioExpanded(!audioExpanded)}
                                className="flex items-center justify-between text-body text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
                            >
                                <span>Audio Tracks ({audioTracks.length})</span>
                                <CaretDownIcon weight="bold" className={`transition-transform ${audioExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            
                            <AnimatePresence>
                                {audioExpanded && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden flex flex-col gap-2 text-sm text-muted mt-1"
                                    >
                                        {audioTracks.map((t, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-white/5 p-2.5 rounded border border-white/5">
                                                <div className="bg-primary/20 text-primary px-2 py-1 rounded font-semibold text-xs shrink-0">
                                                    {t.Format}
                                                </div>
                                                <div className="flex flex-col gap-0.5 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        {t.Language && <span className="text-body font-medium">{t.Language}</span>}
                                                        {t.Channels && <span className="text-muted text-xs">• {t.Channels} ch</span>}
                                                    </div>
                                                    {t.Title && <span className="text-muted text-xs italic truncate">{t.Title}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Subtitle Tracks Section */}
                    {textTracks.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={() => setSubsExpanded(!subsExpanded)}
                                className="flex items-center justify-between text-body text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
                            >
                                <span>Subtitles ({textTracks.length})</span>
                                <CaretDownIcon weight="bold" className={`transition-transform ${subsExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            
                            <AnimatePresence>
                                {subsExpanded && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden flex flex-col gap-2 text-sm text-muted mt-1"
                                    >
                                        {textTracks.map((t, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-white/5 p-2.5 rounded border border-white/5">
                                                <div className="bg-white/10 text-body px-2 py-1 rounded font-semibold text-xs shrink-0 uppercase">
                                                    {t.Format || `Track ${i+1}`}
                                                </div>
                                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {t.Title && <span className="text-body font-medium">{t.Title}</span>}
                                                        {t.Default === 'Yes' && <span className="text-primary text-[10px] border border-primary/30 px-1 rounded uppercase tracking-wider">Default</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-muted text-sm mt-2">Failed to load metadata.</div>
            )}
        </div>
    );
};

export function FileInfoModal({ isOpen, onClose, media }) {
    const filePaths = media?.filePaths;
    const [results, setResults] = useState({});

    useEffect(() => {
        if (!isOpen || !filePaths) return;
        
        let mounted = true;
        
        const loadSequential = async () => {
            for (const path of filePaths) {
                if (!mounted) break;
                if (results[path]) continue;
                
                try {
                    const data = await extractVideoMetadata(path);
                    if (mounted) {
                        setResults(prev => ({ ...prev, [path]: data.media?.track || [] }));
                    }
                } catch (e) {
                    console.error("Failed to extract metadata for", path, e);
                    if (mounted) {
                        setResults(prev => ({ ...prev, [path]: { error: true } }));
                    }
                }
            }
        };
        
        loadSequential();
        
        return () => { mounted = false; };
    }, [isOpen, filePaths]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="File Information" className="max-w-3xl">
            <div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto noScrollbar pr-2">
                {isOpen && filePaths?.map(path => (
                    <FileInfoCard 
                        key={path} 
                        path={path} 
                        info={results[path]} 
                        loading={!results[path]}
                        media={media} 
                    />
                ))}
            </div>
        </Modal>
    );
}
