import { auth, signIn, signOut, prisma } from "@/auth";
import { revalidatePath } from "next/cache";
import Link from "next/link"; // Required for Day 3 navigation

export default async function Home() {
  const session = await auth();

  // 1. Logged Out State
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
        <h1 className="text-4xl font-extrabold mb-6 text-blue-900">Student Travel Planner</h1>
        <p className="mb-8 text-gray-600">Sign in to start planning your adventures!</p>
        <form action={async () => { "use server"; await signIn("google"); }}>
          <button className="bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-full shadow-md hover:shadow-lg transition-all font-medium">
            Sign in with Google
          </button>
        </form>
      </div>
    );
  }

  // 2. FETCH: Get all trips for the logged-in user
  const myTrips = await prisma.trip.findMany({
    where: { userId: session.user?.id },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <main className="p-6 md:p-12 max-w-4xl mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hi, {session.user?.name}! 👋</h1>
          <p className="text-blue-600 text-sm font-medium">Your Travel Dashboard</p>
        </div>
        <form action={async () => { "use server"; await signOut(); }}>
          <button className="text-sm bg-red-50 text-red-500 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 transition">
            Logout
          </button>
        </form>
      </div>

      {/* 3. ADD TRIP FORM */}
      <section className="mb-12">
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
          <h2 className="text-lg font-bold text-blue-900 mb-4">Add a New Adventure</h2>
          <form action={async (formData) => {
            "use server";
            const destination = formData.get("destination") as string;
            const budget = parseFloat(formData.get("budget") as string) || 0;
            const travelMode = formData.get("travelMode") as string;
            const userId = session.user?.id;

            if (!userId || !destination) return;

            await prisma.trip.create({
              data: {
                destination,
                budget,
                travelMode,
                user: { connect: { id: userId } }
              }
            });
            
            revalidatePath("/");
          }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <input name="destination" placeholder="Destination" className="p-3 rounded-xl border-2 focus:border-blue-500 outline-none bg-white" required />
            <input name="budget" type="number" placeholder="Budget (₹)" className="p-3 rounded-xl border-2 focus:border-blue-500 outline-none bg-white" />
            <select name="travelMode" className="p-3 rounded-xl border-2 outline-none bg-white focus:border-blue-500">
              <option value="Flight">✈️ Flight</option>
              <option value="Train">🚆 Train</option>
              <option value="Bus">🚌 Bus</option>
              <option value="Car">🚗 Car</option>
            </select>
            <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl font-bold shadow-md hover:bg-blue-700 transition">
              Add Trip
            </button>
          </form>
        </div>
      </section>

      {/* 4. TRIP LIST (Wrapped in Links for Day 3 Navigation) */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-6">🗺️ My Itineraries</h2>
        {myTrips.length === 0 ? (
          <p className="text-gray-400 italic text-center py-10 border-2 border-dashed rounded-2xl">No trips yet.</p>
        ) : (
          <div className="grid gap-4">
            {myTrips.map((trip) => (
              <div key={trip.id} className="relative group">
                {/* The Link makes the whole card clickable */}
                <Link href={`/trip/${trip.id}`} className="block">
                  <div className="p-5 bg-white border border-gray-200 rounded-2xl flex justify-between items-center shadow-sm group-hover:border-blue-500 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl bg-blue-50 p-3 rounded-xl group-hover:bg-blue-100 transition">
                        {trip.travelMode === "Flight" ? "✈️" : 
                         trip.travelMode === "Train" ? "🚆" : 
                         trip.travelMode === "Bus" ? "🚌" : "🚗"}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">{trip.destination}</h3>
                        <div className="flex gap-3 items-center mt-1">
                          <span className="text-sm font-semibold text-blue-600">₹{trip.budget?.toLocaleString()}</span>
                          <span className="text-gray-300">|</span>
                          <span className="text-xs text-gray-400">View Details →</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Separate Delete Button (kept outside the Link to prevent accidental navigation) */}
                <form 
                  action={async () => {
                    "use server";
                    await prisma.trip.delete({ where: { id: trip.id } });
                    revalidatePath("/");
                  }}
                  className="absolute right-5 top-1/2 -translate-y-1/2"
                >
                  <button className="text-gray-300 hover:text-red-500 p-2 transition z-10">
                    Delete
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}