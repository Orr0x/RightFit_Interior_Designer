import ServicePage from './ServicePage';

const Flooring = () => {
  return (
    <ServicePage
      title="Expert Flooring Installation"
      description="Enhance your interiors with our expert flooring services, offering a variety of materials and finishes to complement your home's aesthetic."
      heroImage="https://c.pxhere.com/photos/62/ef/tv-362221.jpg!d"
      content={[
        {
          heading: "Comprehensive Flooring Solutions",
          text: "Transform your home with our professional flooring installation services. We offer a complete range of flooring options including hardwood, laminate, luxury vinyl, and engineered wood. Our experienced team provides expert advice to help you choose the perfect flooring solution for each room in your home."
        },
        {
          heading: "Quality Materials & Installation",
          text: "We partner with leading flooring manufacturers to provide you with high-quality materials that combine durability with style. Our skilled installers ensure every floor is fitted to perfection, with attention to detail in preparation, installation, and finishing touches including skirting boards and transition strips."
        },
        {
          heading: "Preparation & Finishing",
          text: "Proper floor preparation is crucial for a long-lasting installation. We handle all aspects of floor preparation including subfloor leveling, moisture testing, and underlay installation. Our service includes removal of old flooring, professional installation, and all finishing work to leave your floors ready to enjoy."
        }
      ]}
      features={[
        "Hardwood flooring installation",
        "Engineered wood flooring",
        "Luxury vinyl plank (LVP) and tile (LVT)",
        "Laminate flooring solutions",
        "Subfloor preparation and leveling",
        "Underlay and moisture barrier installation",
        "Skirting board and trim installation",
        "Floor restoration and refinishing"
      ]}
    />
  );
};

export default Flooring;