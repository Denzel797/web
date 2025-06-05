import Link from 'next/link';

/**
 * Navigation component renders links to the main pages.
 * It wraps the existing markup in a functional component
 * so it can be reused across the application.
 */
export default function Navigation() {
  return (
    <div className="flex space-x-4">
      <Link href="/trips" className="text-gray-700 hover:text-gray-900">
        Trips
      </Link>
      <Link href="/bookings" className="text-gray-700 hover:text-gray-900">
        Bookings
      </Link>
    </div>
  );
}
