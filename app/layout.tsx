import type {Metadata} from 'next';
import './style.css';
export const metadata:Metadata={title:'Masjid Ibrahim | Digital Signage',description:'Prayer timetable, community announcements and flyers for Masjid Ibrahim in Spring, TX'};
export default function Root({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
