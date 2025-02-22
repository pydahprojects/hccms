import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  autoSlide?: boolean;
  autoSlideInterval?: number;
}

const images = [
  {
    url: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1000',
    caption: 'Campus Infrastructure Issues'
  },
  {
    url: 'https://images.unsplash.com/photo-1635350736475-c8cef4b21906?auto=format&fit=crop&q=80&w=1000',
    caption: 'Hostel Facilities'
  },
  {
    url: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&q=80&w=1000',
    caption: 'Mess and Food Quality'
  },
  {
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000',
    caption: 'Anti-Ragging Awareness'
  },
  {
    url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1000',
    caption: 'Academic Support'
  }
];

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  autoSlide = false,
  autoSlideInterval = 3000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (!autoSlide) return;

    const slideInterval = setInterval(goToNext, autoSlideInterval);
    return () => clearInterval(slideInterval);
  }, [autoSlide, autoSlideInterval]);

  return (
    <div className="relative w-full max-w-4xl mx-auto my-8 px-4">
      <div className="relative h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden rounded-xl">
        {/* Image */}
        <img
          src={images[currentIndex].url}
          alt={images[currentIndex].caption}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        
        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
          <p className="text-center text-lg">{images[currentIndex].caption}</p>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Dot Navigation */}
      <div className="flex justify-center gap-2 mt-4">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-[#F27528] w-6'
                : 'bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;