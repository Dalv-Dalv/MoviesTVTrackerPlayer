import { useNavigate } from "react-router-dom";
import { useVideoLibrary } from "../contexts/VideoLibraryContext";

export default function HomePage({ className = '' }) {
    const navigate = useNavigate();

    const { library, isScanning, rescanLibrary, addFolderAndScan } = useVideoLibrary();
    const mediaItems = Object.values(library);

    return (
        <div className="text-body">
            <p>hi there .</p>
            <p>hi there ..</p>
            <p>hi there ...</p>
            <p>hi there ....</p>
            <p>hi there .....</p>
            <p>hi there .</p>
            <p>hi there ..</p>
            <p>hi there ...</p>
            <p>hi there ....</p>
            <p>hi there .....</p>
            <p>hi there .</p>
            <p>hi there ..</p>
            <p>hi there ...</p>
            <p>hi there ....</p>
            <p>hi there .....</p>
            <p>hi there .</p>
            <p>hi there ..</p>
            <p>hi there ...</p>
            <p>hi there ....</p>
            <p>hi there .....</p>
            <p>hi there .</p>
            <p>hi there ..</p>
            <p>hi there ...</p>
            <p>hi there ....</p>
            <p>hi there .....</p>
            <p>hi there .</p>
            <p>hi there ..</p>
            <p>hi there ...</p>
            <p>hi there ....</p>
            <p>hi there .....</p>
            <p>hi there .</p>
            <p>hi there ..</p>
            <p>hi there ...</p>
            <p>hi there ....</p>
            <p>hi there .....</p>
            <p>hi there .</p>
            <p>hi there ..</p>
            <p>hi there ...</p>
            <p>hi there ....</p>
            <p>hi there .....</p>
            <p>hi there .</p>
            <p>hi there ..</p>
            <p>hi there ...</p>
            <p>hi there ....</p>
            <p>hi there .....</p>
            <p>hi there .</p>
            <p>hi there ..</p>
            <p>hi there ...</p>
            <p>hi there ....</p>
            <p>hi there .....</p>
            <p>hi there .</p>
            <p>hi there ..</p>
            <p>hi there ...</p>
            <p>hi there ....</p>
            <p>hi there .....</p>
            <p>hi there .</p>
            <p>hi there ..</p>
            <p>hi there ...</p>
            <p>hi there ....</p>
            <p>hi there .....</p>
            <p>hi there .</p>
            <p>hi there ..</p>
            <p>hi there ...</p>
            <p>hi there ....</p>
            <p>hi there .....</p>
            <p>hi there .</p>
            <p>hi there ..</p>
            <p>hi there ...</p>
            <p>hi there ....</p>
            <p>hi there .....</p>
            <p>hi there .</p>
            <p>hi there ..</p>
            <p>hi there ...</p>
            <p>hi there ....</p>
            <p>hi there .....</p>
            <p>hi there .</p>
            <p>hi there ..</p>
            <p>hi there ...</p>
            <p>hi there ....</p>
            <p>hi there .....</p>
            <p>hi there .</p>
            <p>hi there ..</p>
            <p>hi there ...</p>
            <p>hi there ....</p>
            <p>hi there .....</p>
            <p>hi there .</p>
            <p>hi there ..</p>
            <p>hi there ...</p>
            <p>hi there ....</p>
            <p>hi there .....</p>
        </div>
    );
}