export default function AdminMemberships() {
  // start from here tomorrow, maybe add a "times visited" field
  // you should rethink and redo this entire page
  return (
    <div className="relative">
      <div className="w-full px-12 py-4">
        <h1 className="text-3xl font-bold">Memberships Management</h1>
        <p className="pt-3">
          Manage access that members of your parking facilities possess.
        </p>
      </div>
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="" style={{ backgroundColor: "#333842" }}>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
        </table>
      </div>
    </div>
  );
}
