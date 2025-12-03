'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Mock Data
const users = [
  { id: 1, name: "Student A", email: "student.a@example.com", joined: "2024-07-01" },
  { id: 2, name: "Student B", email: "student.b@example.com", joined: "2024-07-02" },
];

const notes = [
  { id: 1, title: "Algebra Notes", user: "Student A", status: "processed" },
  { id: 2, title: "Calculus PDF", user: "Student B", status: "pending" },
];

const logs = [
  { level: "INFO", message: "User student.a@example.com logged in.", timestamp: "2024-07-27 10:00:00" },
  { level: "ERROR", message: "Failed to process note ID 3.", timestamp: "2024-07-27 10:05:00" },
];

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-background p-8 space-y-8">
      <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>

      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.joined}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.map(note => (
                <TableRow key={note.id}>
                  <TableCell>{note.id}</TableCell>
                  <TableCell>{note.title}</TableCell>
                  <TableCell>{note.user}</TableCell>
                  <TableCell>{note.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>System Logs</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, i) => (
                <TableRow key={i}>
                  <TableCell className={log.level === 'ERROR' ? 'text-red-500' : ''}>{log.level}</TableCell>
                  <TableCell>{log.message}</TableCell>
                  <TableCell>{log.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
