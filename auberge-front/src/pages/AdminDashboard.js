"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Calendar, Users, Bed, Plus, Edit, Trash2, LogOut, Home, Eye, RefreshCw, Upload, X } from "lucide-react"

// Import the actual images to ensure they exist
import room1 from "../assets/room1.jpg"
import room2 from "../assets/room2.jpg"
import room3 from "../assets/room3.jpg"
import room4 from "../assets/room4.jpg"
import room5 from "../assets/room5.jpg"
import room6 from "../assets/room6.jpg"
import room7 from "../assets/room7.jpg"

// Create a mapping of room names to images
const roomImageMap = {
  Masmouda: room1,
  Sanhaja: room2,
  "Ait Sadden": room3,
  "Ait Youssi": room4,
  "Ait Ayoub": room5,
  "Allal El Fassi": room6,
  "Ait Ali": room7,
}

// Alternative: map by filename if your database stores filenames
const fileImageMap = {
  "room1.jpg": room1,
  "room2.jpg": room2,
  "room3.jpg": room3,
  "room4.jpg": room4,
  "room5.jpg": room5,
  "room6.jpg": room6,
  "room7.jpg": room7,
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("bookings")
  const [bookings, setBookings] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [newRoom, setNewRoom] = useState({
    label: "",
    description: "",
    price: "",
    images: [],
  })
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  // Server URL - make sure this matches your server
  const SERVER_URL = "http://localhost:5000"

  // Function to get the correct image for a room
  const getRoomImage = (room) => {
    console.log("Getting image for room:", room)

    // First try to get uploaded images from the server
    if (room.images && room.images.length > 0) {
      const imagePath = room.images[0]
      // Try server uploaded images first
      const serverImageUrl = `${SERVER_URL}/uploads/${imagePath}`
      console.log("Trying server image:", serverImageUrl)
      return serverImageUrl
    }

    // Try to get image by room name from local assets
    if (roomImageMap[room.label]) {
      console.log("Found image by room name:", room.label)
      return roomImageMap[room.label]
    }

    // Fallback to placeholder
    console.log("No image found, using placeholder")
    return "/placeholder.svg?height=200&width=300"
  }

  useEffect(() => {
    checkAuth()
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem("adminToken")
    if (!token) {
      navigate("/AdminLogin")
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem("adminToken")

      if (!token) {
        navigate("/AdminLogin")
        return
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }

      console.log("Fetching data from server...")

      const [bookingsRes, roomsRes] = await Promise.all([
        fetch(`${SERVER_URL}/api/admin/bookings`, { headers }),
        fetch(`${SERVER_URL}/api/admin/rooms`, { headers }),
      ])

      console.log("Bookings response status:", bookingsRes.status)
      console.log("Rooms response status:", roomsRes.status)

      if (bookingsRes.ok && roomsRes.ok) {
        const bookingsData = await bookingsRes.json()
        const roomsData = await roomsRes.json()

        console.log("Bookings data:", bookingsData)
        console.log("Rooms data:", roomsData)
        roomsData.forEach((room) => {
          console.log(`Room: ${room.label}, Images:`, room.images)
        })

        setBookings(bookingsData)
        setRooms(roomsData)
      } else {
        if (bookingsRes.status === 401 || roomsRes.status === 401) {
          localStorage.removeItem("adminToken")
          navigate("/AdminLogin")
          return
        }
        setError("Failed to fetch data from server")
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to connect to server. Make sure the server is running on port 5000.")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    navigate("/AdminLogin")
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles(files)
    setUploadError(null) // Clear any previous errors
  }

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (files) => {
    if (!files || files.length === 0) return []

    setUploadingImages(true)
    setUploadError(null)
    const uploadedFilenames = []

    try {
      const token = localStorage.getItem("adminToken")

      for (const file of files) {
        // Create a FormData object for each file
        const formData = new FormData()
        formData.append("image", file)

        console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`)

        // Log the FormData contents for debugging
        for (const [key, value] of formData.entries()) {
          console.log(`FormData contains: ${key} = ${value instanceof File ? value.name : value}`)
        }

        const response = await fetch(`${SERVER_URL}/api/admin/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type here, the browser will set it with the boundary parameter
          },
          body: formData,
        })

        console.log("Upload response status:", response.status)

        if (response.ok) {
          const result = await response.json()
          console.log("Upload success:", result)
          uploadedFilenames.push(result.filename)
        } else {
          // Try to get error details
          let errorText = "Failed to upload image"
          try {
            const errorData = await response.json()
            errorText = errorData.error || errorText
          } catch (e) {
            // If we can't parse JSON, use the status text
            errorText = `${errorText}: ${response.statusText}`
          }

          console.error(`Failed to upload image: ${file.name}. Error: ${errorText}`)
          setUploadError(`Failed to upload image: ${file.name}. Error: ${errorText}`)
          throw new Error(errorText)
        }
      }

      return uploadedFilenames
    } catch (error) {
      console.error("Error uploading images:", error)
      setUploadError(error.message || "Error uploading images")
      return []
    } finally {
      setUploadingImages(false)
    }
  }

  const handleAddRoom = async (e) => {
    e.preventDefault()
    setUploadError(null)

    try {
      setUploadingImages(true)
      const token = localStorage.getItem("adminToken")

      // Upload images first
      const uploadedImages = await uploadImages(selectedFiles)

      if (uploadedImages.length === 0 && selectedFiles.length > 0) {
        // If we had files to upload but none succeeded, don't proceed
        return
      }

      // Create room data with uploaded image filenames
      const roomData = {
        ...newRoom,
        images: uploadedImages,
      }

      console.log("Creating room with data:", roomData)

      const response = await fetch(`${SERVER_URL}/api/admin/rooms`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roomData),
      })

      if (response.ok) {
        setShowAddRoom(false)
        setNewRoom({ label: "", description: "", price: "", images: [] })
        setSelectedFiles([])
        fetchData()
        alert("Room added successfully!")
      } else {
        const errorData = await response.json()
        setError(`Failed to add room: ${errorData.message || response.statusText}`)
        alert(`Failed to add room: ${errorData.message || response.statusText}`)
      }
    } catch (error) {
      console.error("Error adding room:", error)
      setError(`Error adding room: ${error.message}`)
      alert(`Error adding room: ${error.message}`)
    } finally {
      setUploadingImages(false)
    }
  }

  const handleEditRoom = async (e) => {
    e.preventDefault()
    setUploadError(null)

    try {
      setUploadingImages(true)
      const token = localStorage.getItem("adminToken")

      // Upload new images if any
      const uploadedImages = await uploadImages(selectedFiles)

      // Combine existing images with new ones
      const allImages = [...(editingRoom.images || []), ...uploadedImages]

      const roomData = {
        ...editingRoom,
        images: allImages,
      }

      console.log("Updating room with data:", roomData)

      const response = await fetch(`${SERVER_URL}/api/admin/rooms/${editingRoom._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roomData),
      })

      if (response.ok) {
        setEditingRoom(null)
        setSelectedFiles([])
        fetchData()
        alert("Room updated successfully!")
      } else {
        const errorData = await response.json()
        setError(`Failed to update room: ${errorData.message || response.statusText}`)
        alert(`Failed to update room: ${errorData.message || response.statusText}`)
      }
    } catch (error) {
      console.error("Error updating room:", error)
      setError(`Error updating room: ${error.message}`)
      alert(`Error updating room: ${error.message}`)
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImageFromRoom = (imageIndex) => {
    if (editingRoom) {
      const updatedImages = editingRoom.images.filter((_, index) => index !== imageIndex)
      setEditingRoom((prev) => ({ ...prev, images: updatedImages }))
    }
  }

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      try {
        const token = localStorage.getItem("adminToken")
        const response = await fetch(`${SERVER_URL}/api/admin/rooms/${roomId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          fetchData()
          alert("Room deleted successfully!")
        } else {
          alert("Failed to delete room")
        }
      } catch (error) {
        console.error("Error deleting room:", error)
        alert("Error deleting room")
      }
    }
  }

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch(`${SERVER_URL}/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchData()
        alert("Booking status updated successfully!")
      } else {
        alert("Failed to update booking status")
      }
    } catch (error) {
      console.error("Error updating booking:", error)
      alert("Error updating booking status")
    }
  }

  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking)
    setShowBookingModal(true)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "#27ae60"
      case "checked-in":
        return "#3498db"
      case "checked-out":
        return "#95a5a6"
      case "cancelled":
        return "#e74c3c"
      default:
        return "#f39c12"
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchData} className="retry-button">
            <RefreshCw size={20} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>
            <Home size={24} />
            Auberge Amazigh Admin
          </h1>
          <div className="header-actions">
            <button onClick={fetchData} className="refresh-button">
              <RefreshCw size={20} />
              Refresh
            </button>
            <button onClick={handleLogout} className="logout-button">
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <button
          className={`nav-button ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          <Calendar size={20} />
          Bookings ({bookings.length})
        </button>
        <button className={`nav-button ${activeTab === "rooms" ? "active" : ""}`} onClick={() => setActiveTab("rooms")}>
          <Bed size={20} />
          Rooms ({rooms.length})
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeTab === "bookings" && (
          <div className="bookings-section">
            <div className="section-header">
              <h2>Bookings Management</h2>
              <div className="stats">
                <div className="stat-card">
                  <span className="stat-number">{bookings.length}</span>
                  <span className="stat-label">Total Bookings</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">{bookings.filter((b) => b.status === "confirmed").length}</span>
                  <span className="stat-label">Confirmed</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">{bookings.filter((b) => b.status === "checked-in").length}</span>
                  <span className="stat-label">Checked In</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">${bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)}</span>
                  <span className="stat-label">Total Revenue</span>
                </div>
              </div>
            </div>

            {bookings.length === 0 ? (
              <div className="no-data">
                <p>No bookings found. Bookings will appear here once customers make reservations.</p>
              </div>
            ) : (
              <div className="bookings-table">
                <table>
                  <thead>
                    <tr>
                      <th>Guest Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Room</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Guests</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking._id}>
                        <td>
                          {booking.firstName} {booking.lastName}
                        </td>
                        <td>{booking.email}</td>
                        <td>{booking.phone}</td>
                        <td>{booking.roomName}</td>
                        <td>{formatDate(booking.checkIn)}</td>
                        <td>{formatDate(booking.checkOut)}</td>
                        <td>
                          <Users size={16} />
                          {booking.guests}
                        </td>
                        <td>${booking.totalPrice}</td>
                        <td>
                          <span className="status-badge" style={{ backgroundColor: getStatusColor(booking.status) }}>
                            {booking.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => viewBookingDetails(booking)}
                              className="view-button"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <select
                              value={booking.status}
                              onChange={(e) => updateBookingStatus(booking._id, e.target.value)}
                              className="status-select"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="checked-in">Checked In</option>
                              <option value="checked-out">Checked Out</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "rooms" && (
          <div className="rooms-section">
            <div className="section-header">
              <h2>Rooms Management</h2>
              <button onClick={() => setShowAddRoom(true)} className="add-button">
                <Plus size={20} />
                Add New Room
              </button>
            </div>

            <div className="rooms-list">
              {rooms.map((room) => (
                <div key={room._id} className="room-card">
                  <div className="room-image">
                    <img
                      src={getRoomImage(room) || "/placeholder.svg"}
                      alt={room.label}
                      onError={(e) => {
                        console.log(`Image failed to load for room: ${room.label}`)
                        e.target.src = "/placeholder.svg?height=200&width=300"
                      }}
                      onLoad={() => console.log(`Image loaded successfully for room: ${room.label}`)}
                    />
                  </div>
                  <div className="room-info">
                    <h3>{room.label}</h3>
                    <p>{room.description}</p>
                    <p className="room-price">Price: ${room.price}/night</p>
                    <p className="room-status">Status: {room.isOccupied ? "Occupied" : "Available"}</p>
                  </div>
                  <div className="room-actions">
                    <button onClick={() => setEditingRoom(room)} className="edit-button">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteRoom(room._id)} className="delete-button">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add/Edit Room Modal */}
            {(showAddRoom || editingRoom) && (
              <div className="modal">
                <div className="modal-content room-modal">
                  <form onSubmit={showAddRoom ? handleAddRoom : handleEditRoom} className="room-form">
                    <h3>{showAddRoom ? "Add New Room" : "Edit Room"}</h3>

                    <label>
                      Label:
                      <input
                        type="text"
                        value={showAddRoom ? newRoom.label : editingRoom?.label || ""}
                        onChange={(e) =>
                          showAddRoom
                            ? setNewRoom((prev) => ({ ...prev, label: e.target.value }))
                            : setEditingRoom((prev) => ({ ...prev, label: e.target.value }))
                        }
                        required
                      />
                    </label>

                    <label>
                      Description:
                      <textarea
                        value={showAddRoom ? newRoom.description : editingRoom?.description || ""}
                        onChange={(e) =>
                          showAddRoom
                            ? setNewRoom((prev) => ({ ...prev, description: e.target.value }))
                            : setEditingRoom((prev) => ({ ...prev, description: e.target.value }))
                        }
                        required
                      />
                    </label>

                    <label>
                      Price:
                      <input
                        type="number"
                        value={showAddRoom ? newRoom.price : editingRoom?.price || ""}
                        onChange={(e) =>
                          showAddRoom
                            ? setNewRoom((prev) => ({ ...prev, price: e.target.value }))
                            : setEditingRoom((prev) => ({ ...prev, price: e.target.value }))
                        }
                        required
                      />
                    </label>

                    {/* Image Upload Section */}
                    <div className="image-upload-section">
                      <label>
                        Room Images:
                        <div className="file-upload-area">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="file-input"
                            id="room-images"
                          />
                          <label htmlFor="room-images" className="file-upload-label">
                            <Upload size={20} />
                            Choose Images
                          </label>
                        </div>
                      </label>

                      {/* Show upload error if any */}
                      {uploadError && (
                        <div className="upload-error">
                          <p>{uploadError}</p>
                        </div>
                      )}

                      {/* Show existing images for editing */}
                      {editingRoom && editingRoom.images && editingRoom.images.length > 0 && (
                        <div className="existing-images">
                          <h4>Current Images:</h4>
                          <div className="image-preview-grid">
                            {editingRoom.images.map((image, index) => (
                              <div key={index} className="image-preview">
                                <img
                                  src={`${SERVER_URL}/uploads/${image}`}
                                  alt={`Room ${index + 1}`}
                                  onError={(e) => {
                                    e.target.src = "/placeholder.svg?height=100&width=100"
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImageFromRoom(index)}
                                  className="remove-image-btn"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Show selected files preview */}
                      {selectedFiles.length > 0 && (
                        <div className="selected-files">
                          <h4>Selected Files:</h4>
                          <div className="file-list">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="file-item">
                                <span>{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeSelectedFile(index)}
                                  className="remove-file-btn"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="form-buttons">
                      <button type="submit" disabled={uploadingImages}>
                        {uploadingImages ? "Uploading..." : showAddRoom ? "Add Room" : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddRoom(false)
                          setEditingRoom(null)
                          setSelectedFiles([])
                          setUploadError(null)
                        }}
                        disabled={uploadingImages}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
                <div
                  className="modal-backdrop"
                  onClick={() => {
                    if (!uploadingImages) {
                      setShowAddRoom(false)
                      setEditingRoom(null)
                      setSelectedFiles([])
                      setUploadError(null)
                    }
                  }}
                ></div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Booking Details Modal */}
      {showBookingModal && selectedBooking && (
        <div className="modal">
          <div className="modal-content booking-details">
            <h3>Booking Details</h3>
            <div className="details-grid">
              <div className="detail-row">
                <strong>Guest:</strong>
                <span>
                  {selectedBooking.firstName} {selectedBooking.lastName}
                </span>
              </div>
              <div className="detail-row">
                <strong>Email:</strong>
                <span>{selectedBooking.email}</span>
              </div>
              <div className="detail-row">
                <strong>Phone:</strong>
                <span>{selectedBooking.phone}</span>
              </div>
              <div className="detail-row">
                <strong>Room:</strong>
                <span>{selectedBooking.roomName}</span>
              </div>
              <div className="detail-row">
                <strong>Check-in:</strong>
                <span>{formatDate(selectedBooking.checkIn)}</span>
              </div>
              <div className="detail-row">
                <strong>Check-out:</strong>
                <span>{formatDate(selectedBooking.checkOut)}</span>
              </div>
              <div className="detail-row">
                <strong>Guests:</strong>
                <span>{selectedBooking.guests}</span>
              </div>
              <div className="detail-row">
                <strong>Total Price:</strong>
                <span>${selectedBooking.totalPrice}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span className="status-badge" style={{ backgroundColor: getStatusColor(selectedBooking.status) }}>
                  {selectedBooking.status}
                </span>
              </div>
              <div className="detail-row">
                <strong>Booking Date:</strong>
                <span>{formatDate(selectedBooking.createdAt)}</span>
              </div>
            </div>

            {selectedBooking.specialRequests && (
              <div className="special-requests">
                <strong>Special Requests:</strong>
                <p>{selectedBooking.specialRequests}</p>
              </div>
            )}

            <button onClick={() => setShowBookingModal(false)} className="close-button">
              Close
            </button>
          </div>
          <div className="modal-backdrop" onClick={() => setShowBookingModal(false)}></div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
