import { useEffect } from "react";
import { useMap } from "react-leaflet/hooks";


export default function MapTaille({ isTourneeCalculee }: { isTourneeCalculee: boolean }) {
    const map = useMap();
    useEffect(() => {

        map.invalidateSize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTourneeCalculee]);
    
    return null;
  };