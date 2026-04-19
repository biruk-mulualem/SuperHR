<template>
  <div class="container">
    <h2>Employee Check-In / Out</h2>

    <!-- Input -->
    <input v-model="employeeId" placeholder="Enter Employee ID" />
    <button @click="handleCheck">Check In / Out</button>

    <!-- Modal -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <img :src="employee.photo" alt="photo" class="avatar" />
        <h3>{{ employee.name }}</h3>
        <p>ID: {{ employee.id }}</p>
        <p>Status: {{ employee.status }}</p>

        <button @click="toggleStatus">
          Toggle Check In/Out
        </button>

        <button @click="showModal = false">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"

const employeeId = ref("")
const showModal = ref(false)

const employee = ref({
  id: "",
  name: "",
  photo: "",
  status: "Checked Out"
})

// Fake database (replace with API later)
const employees = [
  {
    id: "101",
    name: "John Doe",
    photo: "https://i.pravatar.cc/150?img=1",
    status: "Checked Out"
  },
  {
    id: "102",
    name: "Jane Smith",
    photo: "https://i.pravatar.cc/150?img=2",
    status: "Checked In"
  }
]

const handleCheck = () => {
  const found = employees.find(e => e.id === employeeId.value)

  if (!found) {
    alert("Employee not found")
    return
  }

  employee.value = { ...found }
  showModal.value = true
}

const toggleStatus = () => {
  employee.value.status =
    employee.value.status === "Checked In"
      ? "Checked Out"
      : "Checked In"
}
</script>

<style>
.container {
  padding: 20px;
  max-width: 400px;
  margin: auto;
  text-align: center;
}

input {
  padding: 10px;
  margin-right: 10px;
}

button {
  padding: 10px;
  margin-top: 10px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.6);
}

.modal-content {
  background: white;
  padding: 20px;
  margin: 10% auto;
  width: 300px;
  border-radius: 10px;
}

.avatar {
  width: 100px;
  border-radius: 50%;
}
</style>