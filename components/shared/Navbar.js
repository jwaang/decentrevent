import Link from "next/link";
import { useAppContext } from "../../layouts/BaseLayout";

const Navbar = () => {
  const addr = useAppContext();

  return (
    <nav className="bg-green-600 shadow-2xl">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-white font-semibold uppercase hidden lg:block h-8 w-auto pt-1">Decentrevent</span>
            </div>

            {/* Pages  */}
            <div className="hidden sm:block sm:ml-6">
              <div className="flex space-x-4">
                <Link href="/">
                  <a className="text-gray-800 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium" aria-current="page">
                    Home
                  </a>
                </Link>
                <Link href="/create">
                  <a className="text-gray-800 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium" aria-current="page">
                    Create Event
                  </a>
                </Link>
              </div>
            </div>
          </div>

          {/* User Account Address  */}
          <div className="hidden sm:block sm:ml-6">
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <span className="text-gray-800 text-xs">👋 &nbsp;</span>
              <span className="text-green-100 text-xs">{addr.primaryAccount}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
