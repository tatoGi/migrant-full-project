<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'საბუთების მენეჯერი', 'slug' => 'document-manager', 'icon' => 'FileText',  'sort_order' => 1],
            ['name' => 'დამსაქმებელი',        'slug' => 'employer',          'icon' => 'Users',     'sort_order' => 2],
            ['name' => 'ტაქსისტი',            'slug' => 'taxi',              'icon' => 'Car',       'sort_order' => 3],
            ['name' => 'მაკლერი',             'slug' => 'broker',            'icon' => 'Home',      'sort_order' => 4],
            ['name' => 'ადვოკატი',            'slug' => 'lawyer',            'icon' => 'Scale',     'sort_order' => 5],
            ['name' => 'თარჯიმანი',           'slug' => 'translator',        'icon' => 'Languages', 'sort_order' => 6],
            ['name' => 'სხვა',                'slug' => 'other',             'icon' => 'Briefcase', 'sort_order' => 7],
        ];

        foreach ($categories as $cat) {
            Category::firstOrCreate(['slug' => $cat['slug']], $cat);
        }
    }
}
