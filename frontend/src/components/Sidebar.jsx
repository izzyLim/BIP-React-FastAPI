export default function Sidebar() {
  return (
    <aside className="w-64 bg-base-200 p-4">
      <nav>
        <ul className="space-y-2">
          <li><a href="/" className="link link-hover">Dashboard</a></li>
          <li><a href="/profile" className="link link-hover">Profile</a></li>
        </ul>
      </nav>
      Dashboard
    </aside>
  )
}
