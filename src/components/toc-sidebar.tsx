type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

type TocSidebarProps = {
  title: string;
  items: TocItem[];
};

export default function TocSidebar({ title, items }: TocSidebarProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label={title}
      className="border-mixed-25 bg-mixed-25/20 sticky top-36 mt-10 hidden max-h-[calc(100vh-10rem)] overflow-auto rounded-lg border p-4 lg:block">
      <p className="text-primary-f50 mb-3 text-sm font-bold tracking-wide">
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`text-mixed-70 hover:text-primary-f50 block text-sm leading-5 transition-colors ${
                item.level === 3 ? "pl-3" : ""
              }`}>
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
