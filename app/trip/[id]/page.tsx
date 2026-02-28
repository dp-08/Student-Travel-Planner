import { prisma } from "@/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function TripDetails({ params }: { params: { id: string } }) {
  const { id } = await params;

  // 1. Fetch trip with ALL relations (Expenses and Todos)
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: { 
      expenses: true, 
      todos: true 
    }
  });

  if (!trip) notFound();

  // 2. SMART MATH: Calculate total spent and remaining balance
  const totalSpent = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = (trip.budget || 0) - totalSpent;

  return (
    <main className="p-4 md:p-12 max-w-5xl mx-auto min-h-screen bg-gray-50">
      <Link href="/" className="text-blue-600 font-medium mb-6 block hover:underline">
        ← Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Main Info & Expenses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h1 className="text-5xl font-black text-gray-900 mb-2">{trip.destination}</h1>
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-bold">
                Budget: ₹{trip.budget?.toLocaleString()}
              </span>
              <span className={`px-4 py-1 rounded-full text-sm font-bold ${balance < 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                Balance: ₹{balance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* EXPENSE TRACKER SECTION */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">💸 Expense Tracker</h2>
            <form action={async (formData) => {
              "use server";
              const item = formData.get("item") as string;
              const amount = parseFloat(formData.get("amount") as string);
              if (!item || isNaN(amount)) return;
              
              await prisma.expense.create({ data: { item, amount, tripId: id } });
              revalidatePath(`/trip/${id}`);
            }} className="flex gap-2 mb-6">
              <input name="item" placeholder="Lunch, Taxi, Hotel..." className="flex-1 p-3 border rounded-xl outline-none focus:border-blue-500" required />
              <input name="amount" type="number" placeholder="₹" className="w-28 p-3 border rounded-xl outline-none focus:border-blue-500" required />
              <button className="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 transition">Add</button>
            </form>

            <div className="space-y-2">
              {trip.expenses.length === 0 && <p className="text-gray-400 italic text-sm">No expenses added yet.</p>}
              {trip.expenses.map(e => (
                <div key={e.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="font-medium text-gray-700">{e.item}</span>
                  <span className="font-bold text-gray-900">₹{e.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Checklist & Notes */}
        <div className="space-y-6">
          {/* PACKING CHECKLIST */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4">🎒 Packing List</h2>
            <form action={async (formData) => {
              "use server";
              const task = formData.get("task") as string;
              if (!task) return;
              await prisma.todo.create({ data: { task, tripId: id } });
              revalidatePath(`/trip/${id}`);
            }} className="flex gap-2 mb-4">
              <input name="task" placeholder="Add item..." className="flex-1 p-2 text-sm border rounded-lg outline-none" />
              <button className="bg-gray-900 text-white px-3 rounded-lg text-sm font-bold">+</button>
            </form>
            <div className="space-y-2">
              {trip.todos.map(todo => (
                <div key={todo.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition">
                  <input type="checkbox" checked={todo.completed} className="w-4 h-4 accent-blue-600" readOnly />
                  <span className="text-sm text-gray-600">{todo.task}</span>
                </div>
              ))}
            </div>
          </section>

          {/* NOTES */}
          <section className="bg-blue-600 p-6 rounded-3xl shadow-lg text-white">
            <h2 className="font-bold mb-3 text-lg">📝 Notes</h2>
            <form action={async (formData) => {
              "use server";
              await prisma.trip.update({
                where: { id },
                data: { notes: formData.get("notes") as string }
              });
              revalidatePath(`/trip/${id}`);
            }}>
              <textarea 
                name="notes" 
                defaultValue={trip.notes || ""} 
                placeholder="Hotel booking IDs, flight times..."
                className="w-full h-32 p-3 rounded-xl border-none text-gray-900 text-sm mb-3 outline-none" 
              />
              <button className="w-full bg-white text-blue-600 py-2 rounded-xl font-bold text-sm hover:bg-blue-50 transition">
                Save Notes
              </button>
            </form>
          </section>
        </div>

      </div>
    </main>
  );
}