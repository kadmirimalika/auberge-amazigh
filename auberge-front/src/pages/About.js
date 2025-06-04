"use client";
import './about.css';
import { useState, useEffect } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Users,
  Award,
  Utensils,
  Mountain,
  ChevronUp,
} from "lucide-react";
import photo1 from "../assets/photo1.jpg";
import photo2 from "../assets/photo2.jpg";
import photo3 from "../assets/photo3.jpg";

export default function AboutUs() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const testimonials = [
    {
      quote:
        "Our stay at Auberge Amazigh was truly unforgettable. The authentic atmosphere, delicious food, and warm hospitality made us feel like we were experiencing the real Morocco.",
      author: "Sarah & John",
      location: "United Kingdom",
    },
    {
      quote:
        "The cultural experiences offered by the auberge were the highlight of our trip. Learning about Amazigh traditions directly from the locals was priceless.",
      author: "Maria & Carlos",
      location: "Spain",
    },
    {
      quote:
        "The attention to detail in preserving authentic Amazigh design while providing modern comforts made our stay both educational and relaxing.",
      author: "Jean-Pierre",
      location: "France",
    },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`about-container ${isVisible ? "fade-in" : ""}`}>
      <div
        className="about-hero"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${photo1})`,
        }}
      >
        <div className="about-hero-overlay">
          <h1 className="hero-title">Our Story</h1>
          <p className="hero-subtitle">
            Experience authentic Amazigh hospitality in the heart of Morocco
          </p>
          <div className="hero-scroll-indicator">
            <div className="scroll-arrow"></div>
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <section className="about-section story-section">
        <h2 className="section-title">About Auberge Amazigh</h2>
        <div className="about-content">
          <div className="about-text">
            <p>
              Nestled in the breathtaking landscapes of Morocco, Auberge Amazigh is more than just a place to stay—it's an immersive journey into the rich cultural heritage of the Amazigh people.
            </p>
            <p>
              Founded in 2005 by the Amazigh family, our auberge combines traditional Berber architecture with modern comforts, creating a unique and authentic experience for our guests. Each room is named after a different Amazigh tribe, honoring the diverse cultural tapestry of the region.
            </p>
            <p>
              Our mission is to provide exceptional hospitality while preserving and sharing the Amazigh culture, traditions, and cuisine with visitors from around the world.
            </p>
          </div>
          <div className="about-image reveal-right">
            <div className="image-frame">
              <img
                src={photo2}
                alt="Auberge Amazigh exterior"
                width={600}
                height={400}
                className="rounded-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="about-section values-section">
        <h2 className="section-title">Our Values</h2>
        <div className="values-container">
          {[{
            icon: <Users size={40} />, title: "Authentic Hospitality", text: "We welcome every guest as family, offering warm, personalized service rooted in Amazigh traditions."
          }, {
            icon: <Mountain size={40} />, title: "Cultural Preservation", text: "We actively preserve and share Amazigh heritage through our architecture, decor, and experiences."
          }, {
            icon: <Utensils size={40} />, title: "Culinary Excellence", text: "Our kitchen serves authentic Amazigh cuisine using locally-sourced ingredients and traditional recipes."
          }, {
            icon: <Award size={40} />, title: "Sustainable Tourism", text: "We're committed to environmental responsibility and supporting the local community."
          }].map((value, i) => (
            <div key={i} className="value-card reveal-up" style={{ animationDelay: `${i * 0.2}s` }}>
              <div className="value-icon">{value.icon}</div>
              <h3>{value.title}</h3>
              <p>{value.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Meet Our Team Section */}
      <section className="about-section team-section">
        <h2 className="section-title">Meet Our Team</h2>
        <div className="team-container">
          {[{
            img: photo3, name: "Youssef Amazigh", role: "Founder & Manager", desc: "With over 20 years of experience in hospitality, Youssef brings his passion for Amazigh culture to every aspect of the auberge."
          }, {
            img: photo1, name: "Amina Tamazight", role: "Head Chef", desc: "Amina creates authentic Amazigh cuisine using traditional recipes passed down through generations."
          }, {
            img: photo2, name: "Hassan Berber", role: "Activities Director", desc: "Hassan's deep knowledge of the local area ensures our guests experience the best adventures and cultural excursions."
          }].map((member, i) => (
            <div key={i} className="team-member reveal-up" style={{ animationDelay: `${i * 0.2}s` }}>
              <div className="team-image-container">
                <div className="team-image">
                  <img
                    src={member.img}
                    alt="Team Member"
                    width={300}
                    height={300}
                    className="rounded-image"
                  />
                </div>
              </div>
              <h3>{member.name}</h3>
              <p className="team-role">{member.role}</p>
              <p>{member.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="about-section testimonials-section">
        <h2 className="section-title">What Our Guests Say</h2>
        <div className="testimonials-slider">
          <div className="testimonial active-testimonial">
            <div className="quote">"</div>
            <p>{testimonials[activeTestimonial].quote}</p>
            <div className="testimonial-author">
              <p><strong>{testimonials[activeTestimonial].author}</strong></p>
              <p>{testimonials[activeTestimonial].location}</p>
            </div>
          </div>
          <div className="testimonial-dots">
            {testimonials.map((_, index) => (
              <span
                key={index}
                className={`dot ${activeTestimonial === index ? "active-dot" : ""}`}
                onClick={() => setActiveTestimonial(index)}
              ></span>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="about-section contact-section">
        <h2 className="section-title">Visit Us</h2>
        <div className="contact-container">
          <div className="contact-info reveal-left">
            {[{
              icon: <MapPin className="contact-icon" />, text: "123 Atlas Mountains Road, Tafraoute, Morocco"
            }, {
              icon: <Phone className="contact-icon" />, text: "+212 5XX XX XX XX"
            }, {
              icon: <Mail className="contact-icon" />, text: "info@aubergeamazigh.com"
            }, {
              icon: <Clock className="contact-icon" />, text: "Reception: Open 24/7"
            }].map((item, i) => (
              <div key={i} className="contact-item">
                {item.icon}<p>{item.text}</p>
              </div>
            ))}
            <button className="contact-button">Book Your Stay</button>
          </div>
          <div className="map-container reveal-right">
            <div className="map-frame">
              <img
                src={photo3}
                alt="Map location"
                width={500}
                height={300}
                className="rounded-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Scroll To Top */}
      {showScrollTop && (
        <button className="scroll-top-button" onClick={scrollToTop}>
          <ChevronUp size={24} />
        </button>
      )}
    </div>
  );
}
