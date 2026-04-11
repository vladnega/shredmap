import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Admin</h1>
      <p className="mt-2 text-gray-600">
        Protect sensitive actions with role checks and move operational tools
        here. The starter does not assume a specific admin product.
      </p>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Next steps</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>• Define who may access this area (e.g. user.role or org role).</p>
          <p>
            • Implement <code className="text-xs">POST /api/admin/items</code> or
            your own admin APIs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
