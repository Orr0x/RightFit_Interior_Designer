import ServicePage from './ServicePage';

const Bedrooms = () => {
  return (
    <ServicePage
      title="Custom Bedroom Solutions"
      description="Transform your bedroom into a serene retreat with our bespoke solutions, including fitted wardrobes, custom storage, and elegant finishes."
      heroImage="https://c.pxhere.com/photos/5c/3f/photo-1606932.jpg!d"
      content={[
        {
          heading: "Bespoke Bedroom Design",
          text: "At RightFit Interiors, we understand that your bedroom is your personal sanctuary. Our expert team specializes in creating custom bedroom solutions that maximize space, enhance functionality, and reflect your personal style. From fitted wardrobes to built-in storage solutions, we transform bedrooms into organized, beautiful spaces."
        },
        {
          heading: "Quality Craftsmanship",
          text: "With over 25 years of experience, our skilled carpenters and joiners use only the finest materials and time-tested techniques. Every piece is crafted to the highest standards, ensuring durability and beauty that will last for years to come. We take pride in our attention to detail and commitment to excellence."
        },
        {
          heading: "Personalized Solutions",
          text: "Every bedroom is unique, and so are our solutions. We work closely with you to understand your specific needs, lifestyle, and design preferences. Whether you need extra storage, a walk-in wardrobe, or custom built-in furniture, we create personalized solutions that perfectly fit your space and requirements."
        }
      ]}
      features={[
        "Fitted wardrobes and closet systems",
        "Custom built-in storage solutions",
        "Bespoke bedroom furniture",
        "Walk-in wardrobe design and installation",
        "Floating shelves and display units",
        "Under-bed storage solutions",
        "Dressing table and vanity units",
        "Custom headboards and bed frames"
      ]}
    />
  );
};

export default Bedrooms;