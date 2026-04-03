<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name'     => 'Admin',
                'email'    => 'admin@emigrant.ge',
                'password' => Hash::make('password'),
                'role'     => 'admin',
            ],
            [
                'name'     => 'Test Provider',
                'email'    => 'provider@emigrant.ge',
                'password' => Hash::make('password'),
                'role'     => 'provider',
            ],
            [
                'name'     => 'Test Client',
                'email'    => 'client@emigrant.ge',
                'password' => Hash::make('password'),
                'role'     => 'client',
            ],
        ];

        foreach ($users as $data) {
            $role = $data['role'];
            unset($data['role']);

            $user = User::updateOrCreate(
                ['email' => $data['email']],
                $data,
            );

            if (! $user->hasRole($role)) {
                $user->assignRole($role);
            }
        }
    }
}
