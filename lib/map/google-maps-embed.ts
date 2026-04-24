export function googleMapsEmbedUrl(latitude: number, longitude: number, zoom = 13): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(
    `${latitude},${longitude}`,
  )}&z=${zoom}&output=embed`;
}
