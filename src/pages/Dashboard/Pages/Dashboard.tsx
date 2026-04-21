import useAuthenticationStore from "../../Authentication/Store/authenticationStore";

export const DashboardPage = () => {
  const user = useAuthenticationStore((state) => state.user);

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="sticky top-0 z-10 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 pl-6">
          Welcome back, {user?.name || user?.username || "there"}! 👋
        </h2>
        <p className="text-gray-600">
          This is your private dashboard. Only authenticated users can see this
          page.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Stat {i}</p>
                <p className="text-3xl font-bold text-gray-900">{i * 1000}</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        ))}
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          User Information
        </h3>
        <div className="space-y-2">
          <p className="text-gray-700">
            <span className="font-medium">ID:</span> {user?.id}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Name:</span>{" "}
            {user?.name || user?.username}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Status:</span>{" "}
            <span className="text-green-600 font-medium">Authenticated</span>
          </p>
        </div>
      </div>
    </div>
  );
};
