export function AdminSitePreviewFrame({
  title,
  src,
}: {
  title: string;
  src: string;
}): React.ReactElement {
  return (
    <iframe
      title={title}
      src={src}
      className="h-full w-full border-0 bg-background"
    />
  );
}
