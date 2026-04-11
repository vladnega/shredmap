export default function ActivityLoading() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
    </section>
  );
}
