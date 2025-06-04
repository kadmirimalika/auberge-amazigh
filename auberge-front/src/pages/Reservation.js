"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"

const Reservation = () => {
  const navigate = useNavigate()
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [roomTypes, setRoomTypes] = useState([]) // Now dynamic instead of hardcoded
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    specialRequests: "",
  })
  const [totalPrice, setTotalPrice] = useState(0)
  const [nights, setNights] = useState(0)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // Server URL - make sure this matches your server
  const SERVER_URL = "http://localhost:5000"

  // Fetch rooms from server with better error handling
  const fetchRooms = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Fetching rooms from server...")

      // Test if server is reachable first
      const healthResponse = await fetch(`${SERVER_URL}/api/health`)
      console.log("Health check response:", healthResponse.status)

      if (!healthResponse.ok) {
        throw new Error("Server is not responding. Please make sure the server is running on port 5000.")
      }

      // Now fetch rooms
      const response = await fetch(`${SERVER_URL}/api/rooms`)
      console.log("Rooms API response status:", response.status)

      if (response.ok) {
        const rooms = await response.json()
        console.log("Fetched rooms:", rooms)

        if (!Array.isArray(rooms)) {
          throw new Error("Invalid response format from server")
        }

        // Transform server data to match the expected format
        const transformedRooms = rooms.map((room) => ({
          label: room.label,
          description: room.description,
          price: room.price,
          images: room.images && room.images.length > 0 ? room.images : ["/placeholder.svg?height=200&width=300"],
          _id: room._id,
        }))

        console.log("Transformed rooms:", transformedRooms)
        setRoomTypes(transformedRooms)
      } else {
        const errorText = await response.text()
        console.error("API Error:", response.status, errorText)
        throw new Error(`Failed to fetch rooms: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error fetching rooms:", error)

      // More specific error messages
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setError("Cannot connect to server. Please make sure the server is running on http://localhost:5000")
      } else {
        setError(`Failed to load rooms: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch rooms on component mount
  useEffect(() => {
    fetchRooms()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const handleRoomSelect = (room) => {
    setSelectedRoom(room)
  }

  const calculateTotal = useCallback(() => {
    if (selectedRoom && formData.checkIn && formData.checkOut) {
      const checkInDate = new Date(formData.checkIn)
      const checkOutDate = new Date(formData.checkOut)
      const timeDiff = checkOutDate.getTime() - checkInDate.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

      if (daysDiff > 0) {
        setNights(daysDiff)
        setTotalPrice(daysDiff * selectedRoom.price)
      } else {
        setNights(0)
        setTotalPrice(0)
      }
    }
  }, [selectedRoom, formData.checkIn, formData.checkOut])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required"
    if (!formData.checkIn) newErrors.checkIn = "Check-in date is required"
    if (!formData.checkOut) newErrors.checkOut = "Check-out date is required"
    if (!selectedRoom) newErrors.room = "Please select a room"

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Date validation
    if (formData.checkIn && formData.checkOut) {
      const checkInDate = new Date(formData.checkIn)
      const checkOutDate = new Date(formData.checkOut)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (checkInDate < today) {
        newErrors.checkIn = "Check-in date cannot be in the past"
      }

      if (checkOutDate <= checkInDate) {
        newErrors.checkOut = "Check-out date must be after check-in date"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      setShowConfirmation(true)
    }
  }

  const confirmBooking = async () => {
    setIsLoading(true)

    try {
      // Prepare booking data to match your server's expected format
      const bookingData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        roomName: selectedRoom.label, // Your server expects 'roomName', not 'roomType'
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        guests: Number.parseInt(formData.guests),
        specialRequests: formData.specialRequests,
        totalPrice: totalPrice,
      }

      console.log("Sending booking data:", bookingData)

      // Make API call to your server
      const response = await fetch(`${SERVER_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      })

      const result = await response.json()

      if (response.ok) {
        alert("Booking confirmed! You will receive a confirmation email shortly.")
        setShowConfirmation(false)
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          checkIn: "",
          checkOut: "",
          guests: 1,
          specialRequests: "",
        })
        setSelectedRoom(null)
        navigate("/")
      } else {
        console.error("Booking error:", result)
        alert(`Booking failed: ${result.message || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error submitting booking:", error)
      alert("There was an error processing your booking. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    calculateTotal()
  }, [calculateTotal])

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0]

  // Show loading state
  if (loading) {
    return (
      <div className="reservation-container">
        <div className="reservation-header">
          <h1>Make a Reservation</h1>
          <p>Loading available rooms...</p>
        </div>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #374b26",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto",
            }}
          ></div>
          <p style={{ marginTop: "1rem", color: "#666" }}>Connecting to server...</p>
        </div>
      </div>
    )
  }

  // Show error state with more details
  if (error) {
    return (
      <div className="reservation-container">
        <div className="reservation-header">
          <h1>Make a Reservation</h1>
          <p>Book your stay at Auberge Amazigh</p>
        </div>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div
            style={{
              backgroundColor: "#f8d7da",
              color: "#721c24",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              border: "1px solid #f5c6cb",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0" }}>Connection Error</h3>
            <p style={{ margin: "0" }}>{error}</p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <p>
              <strong>Troubleshooting steps:</strong>
            </p>
            <ol style={{ textAlign: "left", display: "inline-block" }}>
              <li>Make sure your server is running</li>
              <li>Check that it's running on port 5000</li>
              <li>
                Try visiting:{" "}
                <a href="http://localhost:5000/api/health" target="_blank" rel="noopener noreferrer">
                  http://localhost:5000/api/health
                </a>
              </li>
            </ol>
          </div>

          <button
            onClick={fetchRooms}
            style={{
              backgroundColor: "#374b26",
              color: "white",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              cursor: "pointer",
              marginRight: "1rem",
            }}
          >
            Try Again
          </button>

          <button
            onClick={() => window.open("http://localhost:5000/api/health", "_blank")}
            style={{
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Test Server
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="reservation-container">
      <div className="reservation-header">
        <h1>Make a Reservation</h1>
        <p>Book your stay at Auberge Amazigh</p>
      </div>

      <div className="reservation-content">
        {/* Room Selection */}
        <div className="room-selection-section">
          <h2>Select Your Room</h2>
          {roomTypes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p>No rooms available at the moment. Please check back later.</p>
            </div>
          ) : (
            <div className="rooms-grid">
              {roomTypes.map((room, index) => (
                <div
                  key={room._id || index}
                  className={`room-card ${selectedRoom?.label === room.label ? "selected" : ""}`}
                  onClick={() => handleRoomSelect(room)}
                >
                  <img
                    src={room.images[0] || "/placeholder.svg?height=200&width=300"}
                    alt={room.label}
                    onError={(e) => {
                      e.target.src = "/placeholder.svg?height=200&width=300"
                    }}
                  />
                  <div className="room-info">
                    <h3>{room.label}</h3>
                    <p>{room.description}</p>
                    <div className="room-price">${room.price} / night</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {errors.room && <div className="error-message">{errors.room}</div>}
        </div>

        {/* Booking Form */}
        <div className="booking-form-section">
          <h2>Booking Details</h2>
          <form onSubmit={handleSubmit} className="booking-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={errors.firstName ? "error" : ""}
                />
                {errors.firstName && <div className="error-message">{errors.firstName}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={errors.lastName ? "error" : ""}
                />
                {errors.lastName && <div className="error-message">{errors.lastName}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? "error" : ""}
                />
                {errors.email && <div className="error-message">{errors.email}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={errors.phone ? "error" : ""}
                />
                {errors.phone && <div className="error-message">{errors.phone}</div>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="checkIn">Check-in Date *</label>
                <input
                  type="date"
                  id="checkIn"
                  name="checkIn"
                  value={formData.checkIn}
                  onChange={handleInputChange}
                  min={today}
                  className={errors.checkIn ? "error" : ""}
                />
                {errors.checkIn && <div className="error-message">{errors.checkIn}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="checkOut">Check-out Date *</label>
                <input
                  type="date"
                  id="checkOut"
                  name="checkOut"
                  value={formData.checkOut}
                  onChange={handleInputChange}
                  min={formData.checkIn || today}
                  className={errors.checkOut ? "error" : ""}
                />
                {errors.checkOut && <div className="error-message">{errors.checkOut}</div>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="guests">Number of Guests</label>
              <select id="guests" name="guests" value={formData.guests} onChange={handleInputChange}>
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num} Guest{num > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="specialRequests">Special Requests</label>
              <textarea
                id="specialRequests"
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleInputChange}
                rows="4"
                placeholder="Any special requests or dietary requirements..."
              />
            </div>

            {/* Booking Summary */}
            {selectedRoom && nights > 0 && (
              <div className="booking-summary">
                <h3>Booking Summary</h3>
                <div className="summary-item">
                  <span>Room:</span>
                  <span>{selectedRoom.label}</span>
                </div>
                <div className="summary-item">
                  <span>Dates:</span>
                  <span>
                    {formData.checkIn} to {formData.checkOut}
                  </span>
                </div>
                <div className="summary-item">
                  <span>Nights:</span>
                  <span>{nights}</span>
                </div>
                <div className="summary-item">
                  <span>Guests:</span>
                  <span>{formData.guests}</span>
                </div>
                <div className="summary-item total">
                  <span>Total:</span>
                  <span>${totalPrice}</span>
                </div>
              </div>
            )}

            <button type="submit" className="submit-button" disabled={isLoading || roomTypes.length === 0}>
              {isLoading ? "Processing..." : "Book Now"}
            </button>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="modal">
          <div className="modal-content confirmation-modal">
            <h3>Confirm Your Booking</h3>
            <div className="confirmation-details">
              <p>
                <strong>Room:</strong> {selectedRoom.label}
              </p>
              <p>
                <strong>Guest:</strong> {formData.firstName} {formData.lastName}
              </p>
              <p>
                <strong>Email:</strong> {formData.email}
              </p>
              <p>
                <strong>Phone:</strong> {formData.phone}
              </p>
              <p>
                <strong>Check-in:</strong> {formData.checkIn}
              </p>
              <p>
                <strong>Check-out:</strong> {formData.checkOut}
              </p>
              <p>
                <strong>Guests:</strong> {formData.guests}
              </p>
              <p>
                <strong>Total:</strong> ${totalPrice} for {nights} night{nights > 1 ? "s" : ""}
              </p>
            </div>
            <div className="modal-buttons">
              <button onClick={() => setShowConfirmation(false)} className="cancel-button" disabled={isLoading}>
                Cancel
              </button>
              <button onClick={confirmBooking} className="confirm-button" disabled={isLoading}>
                {isLoading ? "Processing..." : "Confirm Booking"}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowConfirmation(false)}></div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default Reservation
