// src/components/Footer.tsx
import { Link } from "react-router-dom";
import Logo from "../assets/BananaEvolution_AboutUs.png";
import Links from "../links/link"; 

function Footer() {
  return (
    <footer className="text-white bg-[#d85a35]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Grid layout with visible separation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 border-b border-white/40 pb-8">
          {/* Banana Logo + About Us */}
          <div className="flex flex-col items-center text-center gap-4">
            <img
              src={Logo}
              alt="Banana Evolution Logo"
              className="w-100 h-auto"
              loading="lazy"
            />
            <p className="text-sm leading-relaxed text-white/90 max-w-prose">
              Banana Evolution is a competitive clicker game where players can earn money through: the monthly leaderboard cash rewards, collecting real value skins and special events. Skins drop every 30 mins, these give in-game powers, and they are tradable for real money.
            </p>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="text-xl font-bold mb-4">Follow Us</h3>
            <nav className="flex flex-col gap-2">
              {["Steam", "Instagram", "Discord", "Reddit", "Youtube"].map((platform) => (
                <a
                  key={platform}
                  href="#"
                  className="hover:underline"
                  aria-label={`Follow us on ${platform}`}
                >
                  {platform}
                </a>
              ))}
            </nav>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="hover:underline">
                Home
              </Link>
              <Link to="/leaderboards" className="hover:underline">
                Leaderboards
              </Link>
              <Link to="/inventory" className="hover:underline">
                Inventory
              </Link>
              <Link to="/pack-store" className="hover:underline">
                Pack Store
              </Link>
              <Link to="/free-stickers" className="hover:underline">
                Free Stickers
              </Link>
              <Link to="/console" className="hover:underline">
                Console
              </Link>
              <Link to="/profile" className="hover:underline">
                Profile
              </Link>
              <Link to="/settings" className="hover:underline">
                Settings
              </Link>
              <a href={Links.download} className="hover:underline">
                Download Banana Evolution
              </a>
            </nav>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-xl font-bold mb-4">Policies</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/prize-policy" className="hover:underline">
                Prize Policy
              </Link>
              <Link to="/leaderboard-policy" className="hover:underline">
                Leaderboard Policy
              </Link>
              <Link to="/privacy-policy" className="hover:underline">
                Privacy Policy
              </Link>
              <Link to="/game-policy" className="hover:underline">
                Game Policy
              </Link>
            </nav>
          </div>

        </div>
        

        

        {/* Footer Bottom */}
        <div className="text-center text-sm font-normal mt-2">
          © {new Date().getFullYear()} Toonedy, All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
