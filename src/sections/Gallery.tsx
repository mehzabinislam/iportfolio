
import { useState } from 'react';
import { Sparkles, X, Eye } from 'lucide-react';
import { portfolioData } from '../data/portfolio';
import type { GalleryItem } from '../types/portfolio';

export function GallerySection() {
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [filter, setFilter] = useState<string>('All');

  const categories = [
    'All',
    'Pen Illustrations',
    'Digital Illustrations',
    'Graphic Design',
    'Crafts & Handmade',
    'Creative Experiments'
  ];

  const filteredGallery = filter === 'All'
    ? portfolioData.gallery
    : portfolioData.gallery.filter(item => item.category === filter);

  return (
    <div className="space-y-6">

      {/* Introduction */}
      <div className="max-w-2xl space-y-3 pb-2">
        <p className="text-sm text-[#292827]/80 leading-relaxed">
          Art has always been one of my hobbies. I enjoy exploring different
          forms of creativity, from pen illustrations and digital art to
          little experiments with different mediums.
        </p>

        <p className="text-sm text-[#292827]/80 leading-relaxed">
          I also got into graphic design through online communities, where
          something I initially did for fun gradually turned into opportunities
          to create graphics for others. It's been a way to explore new styles,
          learn along the way, and turn a personal interest into experience.
        </p>

        <p className="text-sm text-[#292827]/80 leading-relaxed">
          Here's a little collection of things I've created, both just for
          myself and along the way.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1.5 pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#613F4D] ${
              filter === cat
                ? 'bg-[#613F4D] text-[#F8F5EF] shadow-sm'
                : 'bg-[#EEE8DE]/70 text-[#292827]/80 hover:bg-[#E8CFCB]/40 hover:text-[#292827]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Artwork Grid */}
      {filteredGallery.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredGallery.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveItem(item)}
              className="group cursor-pointer rounded-2xl p-5 border border-[#C99B9B]/25 hover:border-[#613F4D]/50 bg-[#F8F5EF] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              {/* Actual Artwork */}
              <div
                className="w-full h-64 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.01]"
                style={{ backgroundColor: item.color }}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-contain"
                />

                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-[#292827]/50 backdrop-blur-md text-white">
                  <Eye className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Artwork Information */}
              <div>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-[#613F4D] mb-1">
                  {item.category}
                </div>

                <h3 className="font-serif text-lg font-medium text-[#292827] mb-1 group-hover:text-[#613F4D] transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs text-[#292827]/75 leading-relaxed mb-3">
                  {item.description}
                </p>

                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#EEE8DE]/70 text-[#292827]/70"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center rounded-2xl bg-[#EEE8DE]/40 border border-[#C99B9B]/20">
          <p className="font-serif text-lg text-[#613F4D]">
            More creations will be added soon.
          </p>
          <p className="text-xs text-[#292827]/60 mt-2">
            Yay!.
          </p>
        </div>
      )}

      {/* Artwork Preview */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#292827]/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="bg-[#F8F5EF] rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#C99B9B]/40 relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveItem(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full text-[#292827]/60 hover:text-[#292827] hover:bg-[#EEE8DE] transition-colors"
              aria-label="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Full Artwork */}
            <div
              className="w-full min-h-56 max-h-[65vh] rounded-2xl mb-5 flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: activeItem.color }}
            >
              <img
                src={activeItem.image}
                alt={activeItem.title}
                className="max-w-full max-h-[65vh] object-contain"
              />
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-widest font-semibold text-[#613F4D]">
                {activeItem.category}
              </div>

              <h4 className="font-serif text-2xl font-medium text-[#292827]">
                {activeItem.title}
              </h4>

              <p className="text-sm text-[#292827]/80 leading-relaxed">
                {activeItem.description}
              </p>

              <div className="flex items-center gap-1.5 pt-2">
                <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
                <span className="text-xs font-mono text-[#292827]/60">
                  {activeItem.tags.join(' • ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
