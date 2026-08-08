export function Features() {
  const features = [
    {
      number: "01",
      title: "Discover",
      text: "Find films shaped around your taste, not just what's popular.",
    },
    {
      number: "02",
      title: "Watch",
      text: "Watch films on your own terms, with no ads or distractions.",
    },
    {
      number: "03",
      title: "Log",
      text: "Keep a personal diary of everything you watch and rate.",
    },
    {
      number: "04",
      title: "Remember",
      text: "Turn your viewing history into something worth looking back on.",
    },
    {
      number: "05",
      title: "Socialize",
      text: "Connect with fellow cinephiles.",
    },
  ];

  return (
    <section className="border-t border-white/[0.08] bg-black px-6 py-16 lg:px-10">
      <div className="mx-auto grid max-w-[1200px] gap-10 md:grid-cols-5">
        {features.map((feature) => (
          <div
            key={feature.number}
            className="border-l border-white/10 pl-6"
          >
            <p className="text-xs font-medium tracking-[0.2em] text-red-400">
              {feature.number}
            </p>

            <h2 className="mt-3 text-2xl font-medium tracking-[-0.03em] text-white">
              {feature.title}
            </h2>

            <p className="mt-3 max-w-sm text-sm leading-6 text-white/45">
              {feature.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}