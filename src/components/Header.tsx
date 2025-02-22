import React from 'react';

const Header = () => {
  return (
    <header className="bg-[#F27528] text-white py-4 px-4 md:px-8">
      <div className="container mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-center">
          Pydah College of Engineering
        </h1>
        <div className="text-center text-sm md:text-base mt-1">
          [Autonomous, NAAC-A, Patavala, Kakinada]
        </div>
      </div>
    </header>
  );
};

export default Header;