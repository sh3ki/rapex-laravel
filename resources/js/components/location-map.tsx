export function LocationMap({
    latitude,
    longitude,
    googleMapsApiKey,
}: {
    latitude: number | null;
    longitude: number | null;
    googleMapsApiKey?: string;
}) {
    if (latitude === null || longitude === null)
        return (
            <div className="bg-muted text-muted-foreground flex h-64 items-center justify-center rounded-lg border text-sm">
                Location preview will appear after access is granted.
            </div>
        );
    const delta = 0.01;
    const bbox = `${longitude - delta},${latitude - delta},${longitude + delta},${latitude + delta}`;
    const source = googleMapsApiKey
        ? `https://www.google.com/maps/embed/v1/view?key=${googleMapsApiKey}&center=${latitude},${longitude}&zoom=16`
        : `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
    return (
        <iframe
            title="Detected location map"
            className="h-64 w-full rounded-lg border"
            src={source}
        />
    );
}
