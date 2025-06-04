"use client"

import { useRef, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import kayaking from "../assets/kayaking.jpg"
import hiking from "../assets/hiking.jpg"

const activities = [
  { title: "Kayaking", image: kayaking },
  { title: "Hiking", image: hiking },
]

const Home = () => {
  const scrollRef = useRef(null)
  const navigate = useNavigate()
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [currentImg, setCurrentImg] = useState(0)
  const [currentActivity, setCurrentActivity] = useState(0)
  const [roomTypes, setRoomTypes] = useState([]) // Now dynamic instead of hardcoded
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Server URL - make sure this matches your server
  const SERVER_URL = "http://localhost:5000"

  // Fetch rooms from server
  const fetchRooms = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Fetching rooms from server for home page...")

      const response = await fetch(`${SERVER_URL}/api/rooms`)

      if (response.ok) {
        const rooms = await response.json()
        console.log("Fetched rooms for home page:", rooms)

        // Transform server data to match the expected format
        const transformedRooms = rooms.map((room) => ({
          label: room.label,
          description: room.description,
          price: room.price,
          images: room.images.length > 0 ? room.images : ["/placeholder.svg?height=200&width=300"],
          _id: room._id,
        }))

        setRoomTypes(transformedRooms)
      } else {
        throw new Error("Failed to fetch rooms")
      }
    } catch (error) {
      console.error("Error fetching rooms for home page:", error)
      setError("Failed to load rooms")
      // Fallback to empty array so the page still renders
      setRoomTypes([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch rooms on component mount
  useEffect(() => {
    fetchRooms()
  }, [])

  const scroll = (direction) => {
    const container = scrollRef.current
    if (container) {
      const scrollAmount = container.offsetWidth * 0.8
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  const openModal = (room) => {
    setSelectedRoom(room)
    setCurrentImg(0)
  }

  const closeModal = () => {
    setSelectedRoom(null)
  }

  const nextImage = () => {
    if (selectedRoom && selectedRoom.images) {
      setCurrentImg((prev) => (prev + 1) % selectedRoom.images.length)
    }
  }

  const prevImage = () => {
    if (selectedRoom && selectedRoom.images) {
      setCurrentImg((prev) => (prev - 1 + selectedRoom.images.length) % selectedRoom.images.length)
    }
  }

  const nextActivity = () => {
    setCurrentActivity((prev) => (prev + 1) % activities.length)
  }

  const prevActivity = () => {
    setCurrentActivity((prev) => (prev - 1 + activities.length) % activities.length)
  }

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivity((prev) => (prev + 1) % activities.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="home-carousel-container">
      <h2 className="carousel-title">Our rooms</h2>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #374b26",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          ></div>
          <p>Loading rooms...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#e74c3c", marginBottom: "1rem" }}>{error}</p>
          <button
            onClick={fetchRooms}
            style={{
              backgroundColor: "#374b26",
              color: "white",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Rooms carousel */}
      {!loading && !error && roomTypes.length > 0 && (
        <div className="carousel-wrapper">
          <button className="carousel-arrow left" onClick={() => scroll("left")}>
            &#8249;
          </button>
          <div className="carousel-content" ref={scrollRef}>
            {roomTypes.map((room, index) => (
              <div className="carousel-card" key={room._id || index} onClick={() => openModal(room)}>
                <img
                  src={room.images[0] || "/placeholder.svg?height=200&width=300"}
                  alt={room.label}
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=200&width=300"
                  }}
                />
                <p>{room.label}</p>
              </div>
            ))}
          </div>
          <button className="carousel-arrow right" onClick={() => scroll("right")}>
            &#8250;
          </button>
        </div>
      )}

      {/* No rooms message */}
      {!loading && !error && roomTypes.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>No rooms available at the moment.</p>
        </div>
      )}

      {/* Room modal */}
      {selectedRoom && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-image-container">
              <button className="modal-nav left" onClick={prevImage}>
                &#8249;
              </button>
              <img
                src={selectedRoom.images[currentImg] || "/placeholder.svg?height=400&width=600"}
                alt={selectedRoom.label}
                className="modal-image"
                onError={(e) => {
                  e.target.src = "/placeholder.svg?height=400&width=600"
                }}
              />
              <button className="modal-nav right" onClick={nextImage}>
                &#8250;
              </button>
            </div>
            <h3>{selectedRoom.label}</h3>
            <p className="modal-description">{selectedRoom.description}</p>
            <p className="modal-price">Price: ${selectedRoom.price} / night</p>
            <button className="book-button" onClick={() => navigate("/reservation")}>
              Book
            </button>
          </div>
          <div className="modal-backdrop" onClick={closeModal}></div>
        </div>
      )}

      {/* Activity Slider Section */}
      <div className="activity-carousel">
        <div className="activity-slide" style={{ backgroundImage: `url(${activities[currentActivity].image})` }}>
          <div className="activity-overlay">
            <h2>{activities[currentActivity].title}</h2>
            <button className="activity-book-button" onClick={() => navigate("/about")}>
              Explore More
            </button>
          </div>
          <button className="activity-nav left" onClick={prevActivity}>
            &#8249;
          </button>
          <button className="activity-nav right" onClick={nextActivity}>
            &#8250;
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default Home
