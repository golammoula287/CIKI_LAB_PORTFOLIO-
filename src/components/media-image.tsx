import Image from "next/image";
export function MediaImage({
  id,
  alt,
  className = "content-image",
}: {
  id: string;
  alt: string;
  className?: string;
}) {
  return (
    <Image
      src={`/api/media/${id}`}
      alt={alt}
      width={1200}
      height={800}
      unoptimized
      className={className}
    />
  );
}
