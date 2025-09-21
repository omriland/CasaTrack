// Simple test script to debug coordinate handling
console.log('Testing coordinate handling...')

// Test the handleAddressChange function behavior
const testFormData = {
  address: '',
  latitude: null,
  longitude: null
}

// Simulate what happens when coordinates are passed
const handleAddressChange = (address, coordinates) => {
  console.log('Address:', address)
  console.log('Coordinates:', coordinates)
  
  const newFormData = {
    ...testFormData,
    address,
    latitude: coordinates?.lat || null,
    longitude: coordinates?.lng || null
  }
  
  console.log('New form data:', newFormData)
}

// Test with coordinates
handleAddressChange('Tel Aviv, Israel', { lat: 32.0853, lng: 34.7818 })

// Test without coordinates
handleAddressChange('Some address', undefined)
