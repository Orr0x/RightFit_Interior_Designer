import ServicePage from './ServicePage';

const InternalDoors = () => {
  return (
    <ServicePage
      title="Internal Door Installation"
      description="Upgrade your home's interior with professionally installed doors, available in a range of styles and materials to suit your design vision."
      heroImage="https://c.pxhere.com/photos/5c/3f/photo-1606932.jpg!d"
      content={[
        {
          heading: "Professional Door Installation",
          text: "Enhance your home's interior with our expert door installation services. We offer a comprehensive range of internal doors in various styles, materials, and finishes to complement your home's aesthetic. From traditional panel doors to modern flush designs, we help you find the perfect doors for every room."
        },
        {
          heading: "Quality Materials & Finishes",
          text: "We work with high-quality door manufacturers to provide you with durable, beautiful doors that stand the test of time. Choose from solid wood, veneer, painted, or glazed options in a variety of styles including shaker, panel, flush, and cottage designs. All doors come with matching frames and architraves for a cohesive look."
        },
        {
          heading: "Expert Fitting Service",
          text: "Our experienced carpenters ensure every door is fitted perfectly, with precise measurements and professional installation. We handle all aspects of the fitting process, including removing old doors, preparing openings, hanging new doors, and fitting handles and hinges for smooth operation."
        }
      ]}
      features={[
        "Wide range of door styles and materials",
        "Solid wood and veneer options",
        "Painted and natural finishes available",
        "Glazed doors for natural light",
        "Fire-rated doors for safety compliance",
        "Sliding and folding door systems",
        "Complete frame and architrave supply",
        "Professional measuring and fitting service"
      ]}
    />
  );
};

export default InternalDoors;