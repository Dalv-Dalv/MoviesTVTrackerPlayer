import { isMobile } from '../utils/PlatformUtils';
import { DesktopSearchPage } from '../../desktop/components/DesktopSearchPage';
import { MobileSearchPage } from '../../mobile/components/MobileSearchPage';

export function SearchPage(props) {
    return isMobile ? <MobileSearchPage {...props} /> : <DesktopSearchPage {...props} />;
}

export default SearchPage;
