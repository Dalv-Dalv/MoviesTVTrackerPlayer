import { useState } from 'react';
import { Modal } from '../../shared/components/Modal';
import { CheckIcon } from '@phosphor-icons/react';
import { useVideoLibrary } from '../../shared/contexts/VideoLibraryContext';

export function RemoveMediaModal({ isOpen, onClose, tmdbId, navigate }) {
    const { removeMedia } = useVideoLibrary();
    const [deleteFromDisk, setDeleteFromDisk] = useState(false);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Remove from Library">
            <p className="mb-6">Are you sure you want to remove this from your library? It will be blacklisted and won't show up again unless you un-blacklist it later.</p>
            
            <div 
                className="flex items-center gap-3 cursor-pointer mb-6" 
                onClick={() => setDeleteFromDisk(!deleteFromDisk)}
            >
                <div className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${deleteFromDisk ? 'bg-danger-600 border-danger-600 text-white' : 'border-divider'}`}>
                    {deleteFromDisk && <CheckIcon size={14} weight='bold' />}
                </div>
                <span className="text-muted select-none">Also delete files from disk</span>
            </div>

            <div className="flex gap-4 justify-end">
                <button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-divider transition-colors cursor-pointer">Cancel</button>
                <button 
                    onClick={async () => {
                        onClose(); 
                        await removeMedia(tmdbId, deleteFromDisk);
                        navigate('/', { replace: true });
                    }} 
                    className="px-4 py-2 bg-danger-600 text-white rounded-lg font-semibold hover:bg-danger-500 transition-colors cursor-pointer"
                >
                    Remove
                </button>
            </div>
        </Modal>
    );
}
