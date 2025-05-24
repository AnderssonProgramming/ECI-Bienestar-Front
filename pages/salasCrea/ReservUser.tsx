"use client"

import React, { useEffect, useState } from "react"
import { CheckCircle, AlertCircle, Package, ArrowLeft } from "lucide-react"
import Swal from "sweetalert2"
import { useRouter } from "next/navigation"
import { aUr } from "@/pages/api/salasCreaU"

const MAX_AFORO = 30

    const rooms = [
    {
        id: "Sala-Crea",
        nombre: "Sala CREA",
        descripcion: "Espacio para actividades creativas"
    },
    {
        id: "Sala-De-Descanso",
        nombre: "Sala de Descanso",
        descripcion: "Espacio para relajación"
    }
    ]

    interface Reserva {
    id?: string
    userName: string
    userId: string
    date: { day: string; time: string }
    roomId: string
    people: number
    state: string
    }

    const ReservUser = () => {
    const [reservas, setReservas] = useState<Reserva[]>([])
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
    const [formData, setFormData] = useState({ people: 1, time: "", day: "" })

    const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null
    const userName = typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Desconocido" : "Desconocido"
    const userId = typeof window !== "undefined" ? sessionStorage.getItem("userId") || "000000" : "000000"
    const apiUrl = aUr
    const [ocupados, setOcupados] = useState<{ [roomId: string]: number }>({})

    const fetchData = async () => {
  if (!token || !apiUrl) {
    console.error("❌ Falta token o API URL")
    return
  }

  try {
    const res = await fetch(`${apiUrl}/revs`, {
      headers: { Authorization: `${token}` }
    })

    const raw = await res.text()
    console.log("🔍 Respuesta RAW desde API /revs:", raw)

    if (!res.ok) {
      console.error("❌ Error de respuesta:", res.status)
      return
    }

    let data: Reserva[] = []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        data = parsed as Reserva[]
      } else if (Array.isArray(parsed.reservas)) {
        data = parsed.reservas as Reserva[]
      } else {
        console.warn("⚠️ No se encontró estructura esperada en la respuesta")
      }
    } catch (e) {
      console.error("❌ Error al parsear JSON:", e)
    }

    console.log("📦 Reservas obtenidas:", data)
    setReservas(data)

    // Calcula ocupados
    const nuevosOcupados: { [roomId: string]: number } = {}
    data.forEach(r => {
      if (r.roomId in nuevosOcupados) {
        nuevosOcupados[r.roomId] += r.people
      } else {
        nuevosOcupados[r.roomId] = r.people
      }
    })
    setOcupados(nuevosOcupados)

  } catch (error) {
    console.error("❌ Error al obtener reservas:", error)
  }
}

    const router = useRouter()

            useEffect(() => {
    fetchData()
    }, [apiUrl, token])


    const getPeopleCount = (roomId: string) => {
        const relevantes = reservas.filter((r) => r.roomId === roomId && r.state === "RESERVA_CONFIRMADA")
        return relevantes.reduce((sum, r) => sum + (r.people || 0), 0)
    }

    const handleSubmit = async () => {
  const { people, time, day } = formData;
  if (!people || !time || !day || !selectedRoom) {
    return Swal.fire("Error", "Completa todos los campos", "error");
  }
  if (!token) {
    return Swal.fire("Error", "Token no encontrado, inicia sesión", "error");
  }
  const reserva: Reserva = {
    userName,
    userId,
    roomId: selectedRoom,
    date: {
      day,
      time: time.includes(":00") ? time : `${time}:00`,
    },
    people,
    state: "RESERVA_CONFIRMADA",
  };
  console.log("📤 Enviando reserva:", JSON.stringify(reserva, null, 2));
  console.log("🔐 Usando token:", token);
  try {
    const res = await fetch(`${apiUrl}/revs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify(reserva),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("⛔ Error al crear reserva. Status:", res.status);
      console.error("⛔ Texto de respuesta:", text);
      Swal.fire("Error", `Error ${res.status}: ${text}`, "error");
      return;
    }
    Swal.fire("Éxito", "Reserva creada correctamente", "success");

    // Llama a fetchData para actualizar las reservas sin recargar la página
    await fetchData();

    setSelectedRoom(null);
    setFormData({ people: 1, time: "", day: "" });
  } catch (e) {
    console.error("❌ Error de red o de aplicación:", e);
    Swal.fire("Error", "No se pudo crear la reserva", "error");
  }
};



    return (
        <div className="p-6 max-w-6xl mx-auto relative">
        <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 text-black hover:text-gray-700 transition"
            aria-label="Volver"
        >
            <ArrowLeft className="w-6 h-6" />
        </button>

        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Reservar Sala</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {rooms.map((room) => {
            const ocupados = getPeopleCount(room.id)
            return (
                <div
                key={room.id}
                className="border rounded-[24px] p-6 shadow-lg hover:shadow-2xl transition bg-white w-full h-[320px] md:h-[340px] flex flex-col justify-between"
                >
                <div className="flex flex-col justify-between h-full">
                    <div>
                    <h3 className="text-lg font-bold mb-2">{room.nombre}</h3>
                    <p className="text-sm text-gray-700 mb-3">{room.descripcion}</p>
                    <ul className="text-sm space-y-2">
                        <li className="flex gap-2 items-center">
                        <Package className="w-5 h-5" /> Aforo total: {MAX_AFORO}
                        </li>
                        <li className="flex gap-2 items-center text-amber-600">
                        <AlertCircle className="w-5 h-5" /> Ocupados: {ocupados}
                        </li>
                        <li className="flex gap-2 items-center text-green-600">
                        <CheckCircle className="w-5 h-5" /> Disponibles:{" "}
                        {Math.max(0, MAX_AFORO - ocupados)}
                        </li>
                    </ul>
                    </div>
                    <button
                    onClick={() => setSelectedRoom(room.id)}
                    className="mt-5 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-base transition"
                    >
                    Crear Reserva
                    </button>
                </div>
                </div>
            )
            })}
        </div>

        {selectedRoom && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl w-[90%] md:w-[400px] shadow-xl relative">
                <button
                onClick={() => setSelectedRoom(null)}
                className="absolute top-3 right-4 text-2xl font-bold text-gray-600 hover:text-red-500"
                >
                ×
                </button>
                <h3 className="text-xl font-semibold mb-5 text-center">Crear Reserva</h3>

                <label className="block text-sm mb-1">Fecha (AAAA-MM-DD)</label>
                <input
                type="date"
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                className="border w-full rounded-md p-2 mb-4 text-sm"
                />

                <label className="block text-sm mb-1">Hora (HH:MM)</label>
                <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="border w-full rounded-md p-2 mb-4 text-sm"
                />

                <label className="block text-sm mb-1">Cantidad de personas</label>
                <input
                type="number"
                min={1}
                max={MAX_AFORO}
                value={formData.people}
                onChange={(e) =>
                    setFormData({
                    ...formData,
                    people: parseInt(e.target.value) || 1
                    })
                }
                className="border w-full rounded-md p-2 mb-6 text-sm"
                />

                <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-4 py-2 rounded-lg w-full hover:bg-green-700 transition text-base"
                >
                Confirmar Reserva
                </button>
            </div>
            </div>
        )}
        </div>
    )
    }

export default ReservUser
