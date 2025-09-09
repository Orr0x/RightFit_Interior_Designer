import ServicePage from './ServicePage';

const MediaWalls = () => {
  return (
    <ServicePage
      title="Custom Media Wall Solutions"
      description="Create stunning media walls with integrated storage and display options, custom built to house your entertainment essentials."
      heroImage="https://c.pxhere.com/photos/62/ef/tv-362221.jpg!d"
      content={[
        {
          heading: "Bespoke Entertainment Centers",
          text: "Transform your living space with our custom media wall solutions. We design and build bespoke entertainment centers that combine style with functionality, creating a focal point for your room while providing organized storage for all your media equipment, games, books, and decorative items."
        },
        {
          heading: "Integrated Technology Solutions",
          text: "Our media walls are designed with modern technology in mind. We incorporate cable management systems, built-in power outlets, and ventilation to keep your equipment running smoothly. From wall-mounted TV installations to integrated sound systems, we ensure your media wall is both beautiful and functional."
        },
        {
          heading: "Custom Storage & Display",
          text: "Every media wall is designed to meet your specific storage and display needs. We create custom shelving, cabinets, and display areas that accommodate your collection while maintaining a clean, organized appearance. Hidden storage keeps clutter at bay while open shelving showcases your favorite items."
        }
      ]}
      features={[
        "Custom TV wall mounting and integration",
        "Built-in shelving and storage solutions",
        "Cable management and power integration",
        "Sound system installation",
        "LED lighting integration",
        "Hidden storage compartments",
        "Display areas for decorative items",
        "Fireplace integration options"
      ]}
    />
  );
};

export default MediaWalls;