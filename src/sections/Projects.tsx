
import { useState } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { GithubIcon } from '../components/ui/SocialIcons';
import { portfolioData } from '../data/portfolio';

export function ProjectsSection() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const categories = ['All', 'Achievements', 'Projects'];

  const achievements = portfolioData.projects.filter(
    item => item.category === 'Achievement'
  );

  const projects = portfolioData.projects.filter(
    item => item.category !== 'Achievement'
  );

  const displayedItems =
    selectedCategory === 'Achievements'
      ? achievements
      : selectedCategory === 'Projects'
        ? projects
        : [...achievements, ...projects];

  return (
    <div className="space-y-6">

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#613F4D] ${
              selectedCategory === cat
                ? 'bg-[#613F4D] text-[#F8F5EF] shadow-sm'
                : 'bg-[#EEE8DE]/70 text-[#292827]/80 hover:bg-[#E8CFCB]/40 hover:text-[#292827]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Achievements and Projects */}
      <div className="space-y-6">
        {displayedItems.map((item) => {
          const isAchievement = item.category === 'Achievement';
          const isExpanded = expandedProjectId === item.id;

          return (
            <article
              key={item.id}
              className={`bg-[#F8F5EF] rounded-2xl border border-[#C99B9B]/25 hover:border-[#613F4D]/40 transition-all duration-300 shadow-sm relative overflow-hidden group ${
                isAchievement ? 'p-5' : 'p-6'
              }`}
            >
              <div
                className={`absolute top-0 left-0 right-0 transition-all duration-300 opacity-60 group-hover:opacity-100 ${
                  isAchievement ? 'h-0.5' : 'h-1'
                }`}
                style={{
                  backgroundColor: item.accentColor || '#613F4D'
                }}
              />

              {/* Achievement Card */}
              {isAchievement ? (
                <>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-[#613F4D] uppercase tracking-widest">
                        Achievement
                      </span>

                      <h3 className="font-serif text-xl font-medium text-[#292827] mt-1 group-hover:text-[#613F4D] transition-colors">
                        {item.title}
                      </h3>
                    </div>

                    <span className="text-xs text-[#292827]/50 font-mono shrink-0">
                      {item.year}
                    </span>
                  </div>

                  <p className="text-sm text-[#292827]/80 leading-relaxed">
                    {item.description}
                  </p>

                  {item.metrics && (
                    <div className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-md bg-[#EEE8DE]/80 text-[#613F4D] text-[11px] font-semibold">
                      <Sparkles className="w-3 h-3" />
                      <span>{item.metrics}</span>
                    </div>
                  )}

                  {item.longDescription && (
                    <>
                      {isExpanded && (
                        <p className="mt-3 text-xs text-[#292827]/70 leading-relaxed">
                          {item.longDescription}
                        </p>
                      )}

                      <button
                        onClick={() =>
                          setExpandedProjectId(
                            isExpanded ? null : item.id
                          )
                        }
                        className="block mt-3 text-xs font-medium text-[#613F4D] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#613F4D] rounded"
                      >
                        {isExpanded ? 'Less details' : 'More details'}
                      </button>
                    </>
                  )}
                </>
              ) : (

                /* Project Card */
                <>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-[#613F4D] uppercase tracking-wider">
                      {item.category}
                    </span>

                    <span className="text-xs text-[#292827]/50 font-mono">
                      {item.year}
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl font-medium text-[#292827] mb-2 group-hover:text-[#613F4D] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-sm text-[#292827]/80 leading-relaxed mb-4">
                    {item.description}
                  </p>

                  {isExpanded && item.longDescription && (
                    <div className="my-4 p-4 rounded-xl bg-[#EEE8DE]/60 border border-[#C99B9B]/20 text-xs text-[#292827]/80 leading-relaxed animate-fade-in">
                      <p>{item.longDescription}</p>
                    </div>
                  )}

                  {item.metrics && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#EEE8DE]/80 text-[#292827]/80 text-[11px] font-medium mb-4">
                      <Sparkles className="w-3 h-3 text-[#D4A373]" />
                      <span>{item.metrics}</span>
                    </div>
                  )}

                  {item.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {item.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-0.8 rounded-md bg-[#EEE8DE]/50 text-[#292827]/70 text-[11px] font-medium border border-[#C99B9B]/20"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#C99B9B]/15">
                    <button
                      onClick={() =>
                        setExpandedProjectId(
                          isExpanded ? null : item.id
                        )
                      }
                      className="text-xs font-medium text-[#613F4D] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#613F4D] rounded"
                    >
                      {isExpanded ? 'Less details' : 'Project overview'}
                    </button>

                    <div className="flex items-center gap-2">
                      {item.githubUrl && (
                        <a
                          href={item.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-[#292827]/70 hover:text-[#292827] hover:bg-[#EEE8DE] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#613F4D]"
                          title="View Source Code"
                          aria-label={`View ${item.title} source code`}
                        >
                          <GithubIcon className="w-4 h-4" />
                        </a>
                      )}

                      {item.liveUrl && (
                        <a
                          href={item.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#613F4D] text-[#F8F5EF] text-xs font-medium hover:bg-[#4E313D] transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#613F4D]"
                        >
                          <span>Live Demo</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </>
              )}
            </article>
          );
        })}

        {displayedItems.length === 0 && (
          <p className="text-sm text-[#292827]/60 text-center py-8">
            Nothing here just yet.
          </p>
        )}
      </div>
    </div>
  );
}
