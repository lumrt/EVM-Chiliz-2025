import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="bg-[#250077]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" passHref>
                  <Image src="/fandom.png" alt="Fandom Logo" width={90} height={30} />
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <Link href="/explorer" className="text-gray-200 hover:bg-[#CD022D] hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                Explorer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 