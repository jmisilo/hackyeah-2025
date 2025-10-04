// import { DbService } from '.';

// export class ProjectDbService extends DbService {
//   static async getProjects({ limit, offset }) {
//     return await this.client.query.projects.findMany({
//       with: {
//         images: { columns: { url: true } },
//         categories: true,
//         user: true,
//       },
//       columns: {
//         id: true,
//         description: true,
//       },
//     });
//   }
// }
