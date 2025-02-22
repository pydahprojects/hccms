import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#5A5656] text-white py-4 px-4 md:px-8 mt-auto">
      <div className="container mx-auto">
        <div className="text-center space-y-2">
          <p className="font-semibold">Pydah College of Engineering</p>
          <p>Kakinada, 533461</p>
          <p>
            Website:{' '}
            <a
              href="http://www.pydahgroup.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              www.pydahgroup.com
            </a>
          </p>
          <p>Contact: 08842315333</p>
          <div className="pt-2 border-t border-white/20 mt-2">
            <p>
              Website developed by: algoX Technologies | Contact: 7675872493
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;